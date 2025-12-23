import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import { cognitoConfig } from './config/cognito'
import './index.css'
import App from './App.jsx'

// Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: cognitoConfig.UserPoolId,
      userPoolClientId: cognitoConfig.ClientId,
      region: cognitoConfig.region,
    }
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
