import React from "react";

class Loader extends React.Component {

    render() {
        return <div style={{
            margin: 0,
            position: 'absolute',
            top: '46%',
            fontSize: 40,
            fontWeight: 600,
            color: '#555',
            left: '50%',
            transform: 'translate(-50%, -50%)'
        }}>
            <div className="ball-pulse-sync">
                <div style={{backgroundColor: '#2a55ad'}}/>
                <div style={{backgroundColor: '#2a55ad'}}/>
                <div style={{backgroundColor: '#2a55ad'}}/>
            </div>
        </div>;
    }
}

export default Loader;
