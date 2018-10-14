import React from "react";
import {FontIcon} from "react-md";

class NoAccess extends React.Component {

    render() {
        return <div style={{display: 'flex', flexDirection: 'column', marginTop: '70px', alignItems: 'center'}}>
            <FontIcon style={{fontSize: '170px'}}>pan_tool</FontIcon>

            <span className="md-caption md-text-center" style={{fontSize: '26px', margin: '20px'}}>¡Casi listo!</span>
            <span className="md-caption md-text-center" style={{fontSize: '26px', margin: '20px'}}>Solo falta que solicites acceso a otro voluntario</span>
        </div>;
    }
}

export default NoAccess;
