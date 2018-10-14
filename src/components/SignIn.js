import React from "react";
import PropTypes from "prop-types";
import Card from 'react-md/lib/Cards/Card';

import Logo from "../logo.png";

import '../firebaseui.css';

class SignIn extends React.Component {

    signIn(type) {
        const firebase = this.props.firebase;
        const provider = type === 'google' ? new firebase.auth.GoogleAuthProvider() : new firebase.auth.FacebookAuthProvider();

        firebase.auth().signInWithPopup(provider).then(result => {
            console.warn('result:');
            console.warn(result);
        }).catch(error => {
            console.warn('error:');
            console.warn(JSON.parse(JSON.stringify(error)));
        });
    }

    render() {
        return <Card style={{width: '70%', marginTop: '20px', padding: '20px'}} className="md-block-centered">
            <div className="firebaseui-container firebaseui-page-provider-sign-in firebaseui-id-page-provider-sign-in firebaseui-use-spinner">
                <ul className="firebaseui-idp-list">
                    <li className="firebaseui-list-item">
                        <button onClick={() => this.signIn('google')} className="firebaseui-idp-button mdl-button mdl-js-button mdl-button--raised firebaseui-idp-google firebaseui-id-idp-button">
                                <span className="firebaseui-idp-icon-wrapper">
                                    <img className="firebaseui-idp-icon" alt="Google" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"/>
                                </span>
                            <span className="firebaseui-idp-text firebaseui-idp-text-long">Acceder con Google</span>
                            <span className="firebaseui-idp-text firebaseui-idp-text-short">Google</span>
                        </button>
                    </li>
                    <li className="firebaseui-list-item">
                        <button onClick={() => this.signIn('facebook')} className="firebaseui-idp-button mdl-button mdl-js-button mdl-button--raised firebaseui-idp-facebook firebaseui-id-idp-button">
                            <span className="firebaseui-idp-icon-wrapper">
                                <img className="firebaseui-idp-icon" alt="Facebook" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/facebook.svg"/>
                            </span>
                            <span className="firebaseui-idp-text firebaseui-idp-text-long">Acceder con Facebook</span>
                            <span className="firebaseui-idp-text firebaseui-idp-text-short">Facebook</span>
                        </button>
                    </li>
                </ul>
            </div>

            <div style={{display: 'flex', justifyContent: 'center'}}>
                <img style={{width: '280px', height: '91px', marginTop: '30px'}} src={Logo} alt="Colegio Pestalozzi"/>
            </div>
        </Card>;
    }
}

SignIn.propTypes = {
    firebase: PropTypes.object.isRequired
};
export default SignIn;
