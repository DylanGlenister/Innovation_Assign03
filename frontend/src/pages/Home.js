import React from 'react';

function Home() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      textAlign: 'center', 
      padding: '20px'
    }}>
      <h1>Welcome to Our Application</h1>
      <p>Explore the different features of our app through the navigation menu.</p>
      <p>This app is designed to provide insightful visualizations and an easy-to-use interface.</p>
      <div style={{ marginTop: '20px' }}>
        <button style={{ padding: '10px 20px', margin: '10px' }}>Get Started</button>
        <button style={{ padding: '10px 20px', margin: '10px' }}>Learn More</button>
      </div>
    </div>
  );
}

export default Home;
