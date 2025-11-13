import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, Heading, Text } from '@chakra-ui/react';

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Box p={8}>
              <Heading mb={4}>Instagram Chatbot SaaS - Admin Panel</Heading>
              <Text>Welcome to the admin panel. This is the initial setup.</Text>
            </Box>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
