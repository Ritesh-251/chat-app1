import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json"; // Adjust path if needed

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export default admin;
