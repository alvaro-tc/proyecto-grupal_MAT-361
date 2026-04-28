const routes = [
  {
    path: ["/", "/home"],
    exact: true,
    component: "Home",
  },
  {
    path: "/graphs",
    exact: true,
    component: "GraphEditor",
  },
  {
    path: "/graphs-matrix",
    exact: true,
    component: "GraphEditorMatrix",
  },
  {
    path: "/algorithms/northwest",
    exact: true,
    component: "Northwest",
  },
  {
    path: "/algorithms/johnson",
    exact: true,
    component: "Johnson",
  },
  {
    path: "/algorithms/assignment",
    exact: true,
    component: "Assignment",
  },
  {
    path: "/algorithms/sort",
    exact: true,
    component: "Sort",
  },
  {
    path: "/algorithms/binary-tree",
    exact: true,
    component: "BinaryTree",
  },
  {
    path: "/algorithms/dijkstra",
    exact: true,
    component: "Dijkstra",
  },
  {
    path: "/algorithms/kruskal",
    exact: true,
    component: "Kruskal",
  },
  {
    path: "/login",
    exact: true,
    component: "Login",
  },
  {
    path: "/signup",
    exact: true,
    component: "Signup",
  },
  {
    path: "/admin",
    exact: true,
    component: "AdminDashboard",
  },
];

export default routes;