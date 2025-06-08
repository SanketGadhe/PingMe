import { UserProvider } from './src/context/UserContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <UserProvider>
      <AppNavigator />
    </UserProvider>
  );
}
