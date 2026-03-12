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
    path: "/algorithms/johnson",
    exact: true,
    component: "Johnson",
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
