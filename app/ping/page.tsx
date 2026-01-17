export default function PingPage() {
    return (
        <div style={{ padding: 50, fontFamily: 'sans-serif' }}>
            <h1>Pong! 🏓</h1>
            <p>If you can see this, the deployment is working correctly.</p>
            <p>Time: {new Date().toISOString()}</p>
        </div>
    )
}
