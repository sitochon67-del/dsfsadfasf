import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import routes from "./routes";
import { store } from "./redux/Store";

export default function App() {
  return (
    <Provider store={store}>
      <RouterProvider router={routes} />
      <ToastContainer />
    </Provider>
  );
}
