import React from "react";
import FontIcon from 'react-md/lib/FontIcons/FontIcon';

class NoConnection extends React.Component {

    render() {
        return <div style={{display: 'flex', flexDirection: 'column', marginTop: '70px', alignItems: 'center'}}>
            <FontIcon style={{fontSize: '170px'}}>signal_wifi_off</FontIcon>
            <span className="md-caption md-text-center" style={{fontSize: '28px'}}>En este momento no tenés conexión a internet</span>
        </div>;
    }
}

export default NoConnection;
