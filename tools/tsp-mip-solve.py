# Slick Oil Arena — TSP kesin optimum çözücü (geliştirme-zamanı aracı).
#
# Büyük TSP senaryolarının optimumunu KESİN çözer: MIP + DFJ alt-tur eleme, iteratif.
# Held-Karp DP bu boyutta imkânsızdır (2ⁿ). Bu araç yalnızca YENİ senaryo üretirken
# çalıştırılır; optimum tsp-scenarios.js'e gömülür, site bağımlısız kalır.
#
# Kurulum:  python -m pip install --user pulp   (CBC çözücü paketle gelir)
# Kullanım:
#   echo "[[x,y],...]" | python tools/tsp-mip-solve.py        → {cost, tour}
#   python tools/tsp-mip-solve.py bench 40 60 100             → rastgele n için süre
#
# Doğruluk: küçük referanslarda MIP == Held-Karp DP (bkz. tools/tsp-solve.mjs).

import sys, json, math, time, random
import pulp

def dist(pts):
    n = len(pts)
    return [[round(math.hypot(pts[i][0]-pts[j][0], pts[i][1]-pts[j][1])) for j in range(n)] for i in range(n)]

def solve_exact(pts, time_limit=None):
    n = len(pts)
    d = dist(pts)
    prob = pulp.LpProblem("tsp", pulp.LpMinimize)
    x = {(i, j): pulp.LpVariable(f"x_{i}_{j}", cat="Binary") for i in range(n) for j in range(i+1, n)}
    xe = lambda i, j: x[(min(i, j), max(i, j))]
    prob += pulp.lpSum(d[i][j]*x[(i, j)] for (i, j) in x)
    for i in range(n):
        prob += pulp.lpSum(xe(i, j) for j in range(n) if j != i) == 2
    solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=time_limit)

    rounds = 0
    while True:
        rounds += 1
        prob.solve(solver)
        if pulp.LpStatus[prob.status] != "Optimal":
            return {"status": pulp.LpStatus[prob.status]}
        edges = [(i, j) for (i, j) in x if x[(i, j)].value() > 0.5]
        adj = {i: [] for i in range(n)}
        for i, j in edges:
            adj[i].append(j); adj[j].append(i)
        # bağlantı bileşenleri (subtour tespiti)
        seen, comps = set(), []
        for s in range(n):
            if s in seen: continue
            stack, comp = [s], []
            while stack:
                u = stack.pop()
                if u in seen: continue
                seen.add(u); comp.append(u)
                for v in adj[u]:
                    if v not in seen: stack.append(v)
            comps.append(comp)
        if len(comps) == 1:
            break
        # her subtour için DFJ kısıtı
        for comp in comps:
            cs = set(comp)
            prob += pulp.lpSum(x[(i, j)] for (i, j) in x if i in cs and j in cs) <= len(comp)-1

    # tur sırasını çıkar
    tour, prev, cur = [0], -1, 0
    while len(tour) < n:
        nxt = next(v for v in adj[cur] if v != prev)
        tour.append(nxt); prev, cur = cur, nxt
    cost = sum(d[tour[k]][tour[(k+1) % n]] for k in range(n))
    return {"status": "Optimal", "cost": cost, "tour": tour, "rounds": rounds}

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "stdin"
    if mode == "bench":
        sizes = [int(a) for a in sys.argv[2:]] or [30, 40, 50]
        for n in sizes:
            random.seed(n)
            pts = [[random.randint(0, 1000), random.randint(0, 1000)] for _ in range(n)]
            t0 = time.time()
            r = solve_exact(pts, time_limit=120)
            ms = int((time.time()-t0)*1000)
            print(f"n={n}: {r.get('status')} cost={r.get('cost')} rounds={r.get('rounds')} {ms}ms")
    else:
        pts = json.load(sys.stdin)
        print(json.dumps(solve_exact(pts)))
