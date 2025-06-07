let nodes = [];
let edges = [];

let mode = 'creation'; // 'creation' ou 'chemin'

let selectedStart = null;
let selectedEnd = null;
let shortestPath = [];

function setup() {
  createCanvas(600, 400);

  // Bouton pour changer mode
  let btn = createButton('Mode: Création');
  btn.position(10, 10);
  btn.mousePressed(() => {
    if (mode === 'creation') {
      mode = 'chemin';
      selectedStart = null;
      selectedEnd = null;
      shortestPath = [];
      btn.html('Mode: Chemin');
    } else {
      mode = 'creation';
      selectedStart = null;
      selectedEnd = null;
      shortestPath = [];
      btn.html('Mode: Création');
    }
  });
}

function draw() {
  background(240);

  // Dessiner arêtes
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

  // Dessiner noeuds
  for (let i = 0; i < nodes.length; i++) {
    fill(200);
    stroke(0);
    strokeWeight(1);
    if (i === selectedStart) fill(0, 255, 0);
    else if (i === selectedEnd) fill(255, 0, 0);
    else if (shortestPath.includes(i)) fill(255, 150, 150);
    ellipse(nodes[i].x, nodes[i].y, 30, 30);

    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    text(i, nodes[i].x, nodes[i].y);
  }

  // Instructions en bas
  noStroke();
  fill(50);
  textSize(14);
  if (mode === 'creation') {
    text('Mode Création : Clique pour créer un noeud. Clique sur deux noeuds successifs pour créer une arête.', 10, height - 20);
  } else {
    text('Mode Chemin : Clique sur deux noeuds pour sélectionner départ (vert) et arrivée (rouge).', 10, height - 20);
  }
}

// Variables pour gérer création d’arêtes
let lastNodeClicked = null;

function mousePressed() {
  // Vérifier si clic sur un noeud existant
  for (let i = 0; i < nodes.length; i++) {
    let d = dist(mouseX, mouseY, nodes[i].x, nodes[i].y);
    if (d < 15) {
      if (mode === 'creation') {
        // En mode création : créer arête entre lastNodeClicked et ce noeud
        if (lastNodeClicked !== null && lastNodeClicked !== i) {
          // Vérifier que l’arête n’existe pas déjà
          if (!edgeExists(lastNodeClicked, i)) {
            edges.push([lastNodeClicked, i]);
          }
          lastNodeClicked = null; // Reset après création
        } else {
          lastNodeClicked = i;
        }
      } else if (mode === 'chemin') {
        // En mode chemin : sélectionner départ/arrivée
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

  // Pas sur noeud
  if (mode === 'creation') {
    nodes.push({ x: mouseX, y: mouseY });
    lastNodeClicked = null;
  }
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
    ) {
      return true;
    }
  }
  return false;
}

function bfs(start, end) {
  let queue = [start];
  let visited = new Array(nodes.length).fill(false);
  let parent = new Array(nodes.length).fill(null);
  visited[start] = true;

  while (queue.length > 0) {
    let current = queue.shift();
    if (current === end) break;

    let neighbors = getNeighbors(current);
    for (let n of neighbors) {
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
  path.reverse();
  return path;
}

function getNeighbors(nodeIndex) {
  let neighbors = [];
  for (let e of edges) {
    if (e[0] === nodeIndex) neighbors.push(e[1]);
    else if (e[1] === nodeIndex) neighbors.push(e[0]);
  }
  return neighbors;
}
