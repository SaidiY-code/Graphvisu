let nodes = [];
let edges = [];

let mode = 'creation'; // 'creation' ou 'chemin'
let selectedStart = null;
let selectedEnd = null;
let selectedNode = null;
let shortestPath = [];
let lastNodeClicked = null;

function setup() {
  createCanvas(1800, 800);

  // Bouton de mode
  let btn = createButton('Mode: Création');
  btn.position(10, 10);
  btn.mousePressed(() => {
    mode = mode === 'creation' ? 'chemin' : 'creation';
    selectedStart = null;
    selectedEnd = null;
    shortestPath = [];
    btn.html('Mode: ' + (mode === 'creation' ? 'Création' : 'Chemin'));
  });

  // Bouton sauvegarder
let btnSave = createButton('Sauvegarder');
btnSave.position(100, 10);
btnSave.mousePressed(() => {
  saveGraph();
});

// Bouton charger
let btnLoad = createButton('Charger');
btnLoad.position(180, 10);
btnLoad.mousePressed(() => {
  let json = prompt("Collez ici le JSON du graphe à charger:");
  if (json) loadGraph(json);
});

  // Bouton pour layout
  let layoutBtn = createButton('Réorganiser (layout propre)');
  layoutBtn.position(30, 70);
  layoutBtn.mousePressed(() => {
    layoutCircle();
  });
  
  let layoutBtn2 = createButton('Réorganiser (layout cercle)');
  layoutBtn2.position(10, 40);
  layoutBtn2.mousePressed(() => {
    applyForceDirectedLayout();
  });
  
  let btnGen = createButton('Générer Graphe');
btnGen.position(150, 10);
btnGen.mousePressed(() => {
  let n = int(prompt("Nombre de noeuds ?"));
  let m = int(prompt("Nombre d'arêtes ?"));
  if (n > 1 && m >= n - 1) {
    genererGraphe(n, m);
  } else {
    alert("Valeurs invalides (minimum : 2 noeuds, m ≥ n-1)");
  }
});

}

function draw() {
  background(240);

  // Arêtes
  strokeWeight(2);
  for (let e of edges) {
    let n1 = nodes[e[0]];
    let n2 = nodes[e[1]];
    if (shortestPathIncludesEdge(e)) {
      stroke(255, 0, 0);
      strokeWeight(4);
    } else {
      stroke(0);
      strokeWeight(2);
    }
    line(n1.x, n1.y, n2.x, n2.y);
  }

  // Nœuds
  for (let i = 0; i < nodes.length; i++) {
    if (i === selectedStart) fill(0, 255, 0);
    else if (i === selectedEnd) fill(255, 0, 0);
    else if (shortestPath.includes(i)) fill(255, 150, 150);
    else if (i === lastNodeClicked && mode === 'creation') fill(100, 100, 255);
    else fill(200);

    stroke(0);
    strokeWeight(1);
    ellipse(nodes[i].x, nodes[i].y, 30, 30);

    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    text(i, nodes[i].x, nodes[i].y);
  }

  // Instructions
  noStroke();
  fill(50);
  textSize(14);
  if (mode === 'creation') {
    text('Mode Création : Clique pour créer un noeud. Clique sur deux noeuds pour créer une arête.', 10, height - 20);
  } else {
    text('Mode Chemin : Clique sur deux noeuds pour définir départ (vert) et arrivée (rouge).', 10, height - 20);
  }
}

function mousePressed() {
  for (let i = 0; i < nodes.length; i++) {
    let d = dist(mouseX, mouseY, nodes[i].x, nodes[i].y);
    if (d < 15) {
      selectedNode = i;

      if (mode === 'creation') {
        if (lastNodeClicked !== null && lastNodeClicked !== i && !edgeExists(lastNodeClicked, i)) {
          edges.push([lastNodeClicked, i]);
          lastNodeClicked = null;
        } else {
          lastNodeClicked = i;
        }
      } else if (mode === 'chemin') {
        if (selectedStart === null) {
          selectedStart = i;
          selectedEnd = null;
          shortestPath = [];
        } else if (selectedEnd === null && i !== selectedStart) {
          selectedEnd = i;
          shortestPath = bfs(selectedStart, selectedEnd);
        } else {
          selectedStart = i;
          selectedEnd = null;
          shortestPath = [];
        }
      }
      return;
    }
  }

  if (mode === 'creation') {
    nodes.push({ x: mouseX, y: mouseY });
    lastNodeClicked = null;
  }
}

function mouseDragged() {
  if (selectedNode !== null) {
    nodes[selectedNode].x = mouseX;
    nodes[selectedNode].y = mouseY;
  }
}

function mouseReleased() {
  selectedNode = null;
}

function edgeExists(a, b) {
  for (let e of edges) {
    if ((e[0] === a && e[1] === b) || (e[0] === b && e[1] === a)) return true;
  }
  return false;
}

function shortestPathIncludesEdge(edge) {
  for (let i = 0; i < shortestPath.length - 1; i++) {
    if (
      (shortestPath[i] === edge[0] && shortestPath[i + 1] === edge[1]) ||
      (shortestPath[i] === edge[1] && shortestPath[i + 1] === edge[0])
    ) return true;
  }
  return false;
}

function getNeighbors(i) {
  let neighbors = [];
  for (let e of edges) {
    if (e[0] === i) neighbors.push(e[1]);
    else if (e[1] === i) neighbors.push(e[0]);
  }
  return neighbors;
}

function bfs(start, end) {
  let queue = [start];
  let visited = new Array(nodes.length).fill(false);
  let parent = new Array(nodes.length).fill(null);
  visited[start] = true;

  while (queue.length > 0) {
    let current = queue.shift();
    if (current === end) break;
    for (let n of getNeighbors(current)) {
      if (!visited[n]) {
        visited[n] = true;
        parent[n] = current;
        queue.push(n);
      }
    }
  }

  let path = [];
  if (!visited[end]) return [];
  for (let at = end; at != null; at = parent[at]) {
    path.push(at);
  }
  return path.reverse();
}

function applyForceDirectedLayout(iterations = 200) {
  const area = width * height * 2.5; // ↑ aire virtuelle augmentée
  const k = Math.sqrt(area / (nodes.length + 1));
  const temperature = 20; // ↑ permet de plus grands déplacements

  for (let iter = 0; iter < iterations; iter++) {
    let disp = nodes.map(() => createVector(0, 0));

    // Répulsion entre tous les nœuds
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        let delta = createVector(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        let distSq = delta.magSq() + 0.01;
        let force = (k * k) / distSq;
        delta.normalize().mult(force);
        disp[i].add(delta);
        disp[j].sub(delta);
      }
    }

    // Attraction des arêtes
    for (let e of edges) {
      let i = e[0], j = e[1];
      let delta = createVector(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      let dist = delta.mag() + 0.01;
      let force = (dist * dist) / (k * 1.5); // ↓ attraction adoucie
      delta.normalize().mult(force);
      disp[i].sub(delta);
      disp[j].add(delta);
    }

    // Mise à jour des positions
    for (let i = 0; i < nodes.length; i++) {
      let d = disp[i];
      d.limit(temperature);
      nodes[i].x += d.x;
      nodes[i].y += d.y;
      nodes[i].x = constrain(nodes[i].x, 30, width - 30);
      nodes[i].y = constrain(nodes[i].y, 30, height - 30);
    }
  }
}


  function genererGraphe(numNodes, numEdges) {
  nodes = [];
  edges = [];

  // Générer les nœuds aléatoirement
  for (let i = 0; i < numNodes; i++) {
    nodes.push({
      x: random(50, width - 50),
      y: random(50, height - 50)
    });
  }

  // 1. Créer une chaîne linéaire pour assurer connexité
  for (let i = 0; i < numNodes - 1; i++) {
    edges.push([i, i + 1]);
  }

  // 2. Ajouter des arêtes aléatoires supplémentaires
  let maxEdges = (numNodes * (numNodes - 1)) / 2; // nombre max d’arêtes possibles dans un graphe simple non orienté
  let targetEdges = min(numEdges, maxEdges);
  let currentEdges = edges.length;

  while (currentEdges < targetEdges) {
    let a = floor(random(numNodes));
    let b = floor(random(numNodes));
    if (a !== b && !edgeExists(a, b)) {
      edges.push([a, b]);
      currentEdges++;
    }
  }
}

function layoutCircle() {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = min(width, height) / 2 - 50; // rayon avec marge

  let n = nodes.length;
  for (let i = 0; i < n; i++) {
    let angle = (TWO_PI / n) * i;
    nodes[i].x = centerX + radius * cos(angle);
    nodes[i].y = centerY + radius * sin(angle);
  }
}
// Sauvegarder le graphe en JSON (affiché dans une popup ou console)
function saveGraph() {
  const graphData = {
    nodes: nodes,
    edges: edges,
  };
  const json = JSON.stringify(graphData);
  // Pour l’exemple, on affiche dans une nouvelle fenêtre
  // Tu peux adapter pour télécharger un fichier ou autre
  window.open().document.write('<pre>' + json + '</pre>');
}

// Charger le graphe à partir d’un JSON donné
function loadGraph(json) {
  try {
    const graphData = JSON.parse(json);
    if (graphData.nodes && graphData.edges) {
      nodes = graphData.nodes;
      edges = graphData.edges;
      selectedStart = null;
      selectedEnd = null;
      shortestPath = [];
    } else {
      alert("Fichier JSON invalide");
    }
  } catch (e) {
    alert("Erreur en chargeant JSON: " + e.message);
  }
}


