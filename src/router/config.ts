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
    path: "/algorithms/selection-sort",
    exact: true,
    component: "SelectionSort",
  },
  {
    path: "/algorithms/insertion-sort",
    exact: true,
    component: "InsertionSort",
  },
  {
  path: "/algorithms/merge-sort",
  exact: true,
  component: "MergeSort",
},
  {
    path: "/algorithms/shell-sort",
    exact: true,
    component: "ShellSort",
  },
  {
    path: "/algorithms/binary-tree",
    exact: true,
    component: "BinaryTree",
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