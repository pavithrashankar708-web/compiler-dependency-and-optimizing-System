from flask import Flask, render_template, request, jsonify
app = Flask(__name__)

def sort_tasks(tasks, dependencies):
    tasks = list(dict.fromkeys(t.strip() for t in tasks if t.strip()))
    graph = {t: [] for t in tasks}
    indegree = {t: 0 for t in tasks}
    for a, b in dependencies:
        if a not in graph or b not in graph:
            return {"status":"Invalid input","message":f"Dependency {a} -> {b} uses a task not listed in Tasks.","order":[],"graph":[],"tasks":tasks}
        if b not in graph[a]:
            graph[a].append(b); indegree[b] += 1
    edges = [{"source":a,"target":b} for a in tasks for b in graph[a]]
    queue = [t for t in tasks if indegree[t] == 0]
    order = []
    while queue:
        t = queue.pop(0); order.append(t)
        for nxt in graph[t]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0: queue.append(nxt)
    if len(order) != len(tasks):
        return {"status":"Cycle detected","message":"A complete topological order does not exist because the graph contains a cycle.","order":[],"graph":edges,"tasks":tasks,"cycle_tasks":[t for t in tasks if indegree[t] > 0]}
    return {"status":"Valid Execution Order","message":"No circular dependencies found.","order":order,"graph":edges,"tasks":tasks}

@app.route("/")
def home(): return render_template("index.html")

@app.post("/api/schedule")
def schedule():
    data = request.get_json(silent=True) or {}
    raw_tasks = data.get("tasks","")
    tasks = raw_tasks if isinstance(raw_tasks,list) else str(raw_tasks).split(",")
    raw = data.get("dependencies","")
    deps = []
    if isinstance(raw,list):
        for item in raw:
            if isinstance(item,dict): deps.append((str(item.get("source","")).strip(),str(item.get("target","")).strip()))
            elif isinstance(item,(list,tuple)) and len(item)>1: deps.append((str(item[0]).strip(),str(item[1]).strip()))
    else:
        for line in str(raw).splitlines():
            line=line.strip()
            if not line: continue
            parts = [x.strip() for x in line.split("->",1)] if "->" in line else ([x.strip() for x in line.split(",",1)] if "," in line else line.split())
            if len(parts)!=2: return jsonify({"status":"Invalid input","message":f"Cannot read dependency: {line}. Use A B or A -> B.","order":[],"graph":[]}),400
            deps.append(tuple(parts))
    result=sort_tasks(tasks,deps)
    return jsonify(result), (400 if result["status"]=="Invalid input" else 200)

@app.get("/api/test-cases")
def test_cases():
    cases=[
      ("Empty graph",[],[],"Empty valid order","V=0, E=0","No tasks to process"),
      ("Independent tasks",["A","B","C","D"],[],"All tasks in order list","V=4, E=0","Every task is initially ready"),
      ("Dependency chain",["A","B","C","D"],[("A","B"),("B","C"),("C","D")],"A, B, C, D","V=4, E=3","Tasks follow prerequisite order"),
      ("Branching graph",["A","B","C","D"],[("A","B"),("A","C"),("B","D"),("C","D")],"A before B and C; B and C before D","V=4, E=4","Either B/C order is valid"),
      ("Directed cycle",["A","B","C"],[("A","B"),("B","C"),("C","A")],"Cycle detected","V=3, E=3","No complete topological order exists")]
    out=[]
    for name,tasks,deps,expected,size,analysis in cases:
        result=sort_tasks(tasks,deps)
        actual="Cycle detected" if result["status"]=="Cycle detected" else (", ".join(result["order"]) if result["order"] else "[]")
        out.append({"name":name,"tasks":tasks,"dependencies":deps,"expected":expected,"size":size,"analysis":analysis,"actual":actual})
    return jsonify(out)

if __name__=="__main__": app.run(debug=True)
