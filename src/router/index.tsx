import { lazy, Suspense } from "react";
import { Switch, Route } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import routes from "./config";
import { Styles } from "../styles/styles";
import { AuthProvider } from "../context/AuthContext";

// Login and Signup pages skip the global Header/Footer layout
const noLayoutRoutes = ["/login", "/signup"];

const Router = () => {
  return (
    <AuthProvider>
      <Suspense fallback={null}>
        <Styles />
        <Switch>
          {routes.map((routeItem) => {
            const isNoLayout = noLayoutRoutes.includes(
              typeof routeItem.path === "string" ? routeItem.path : routeItem.path[0]
            );

            if (isNoLayout) {
              return (
                <Route
                  key={routeItem.component}
                  path={routeItem.path}
                  exact={routeItem.exact}
                  component={lazy(() => import(`../pages/${routeItem.component}`))}
                />
              );
            }

            return (
              <Route
                key={routeItem.component}
                path={routeItem.path}
                exact={routeItem.exact}
                render={(props) => {
                  const Component = lazy(() => import(`../pages/${routeItem.component}`));
                  return (
                    <>
                      <Header />
                      <Component {...props} />
                      <Footer />
                    </>
                  );
                }}
              />
            );
          })}
        </Switch>
      </Suspense>
    </AuthProvider>
  );
};

export default Router;
