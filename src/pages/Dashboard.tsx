import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div>
      <h1>Home page</h1>
      <p>This route has public access.</p>
      <Link to="/login">Login</Link>
    </div>
  );
};

export default Dashboard;
