import { HomeScreen } from "./HomeScreen";
import { useAutoConnect } from "../hooks/useAutoConnect";

export function App() {
  useAutoConnect();

  return <HomeScreen />;
}
