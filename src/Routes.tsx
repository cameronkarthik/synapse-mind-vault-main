import { Routes as RouterRoutes, Route } from "react-router-dom";
import Index from "./pages/Index";
import History from "./pages/History";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

const Routes = () => {
  return (
    <RouterRoutes>
      <Route path="/" element={<Index />} />
      <Route path="/history" element={<History />} />
      <Route path="/help" element={<Help />} />
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};

export default Routes;
