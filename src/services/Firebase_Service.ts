import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAm8lP4kfB0412VBBxhVv-4WiSN0RyzFNQ",
  authDomain: "reactnative-a18b9.firebaseapp.com",
  projectId: "reactnative-a18b9",
  storageBucket: "reactnative-a18b9.appspot.com",
  messagingSenderId: "844731143373",
  appId: "1:844731143373:web:f81981a5ddcb62776c0584",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // ✅ không cần ép kiểu Firestore

export class FirebaseService {
  getCollectionRef(name: string) {
    return collection(db, name);
  }

  async createDoc(collectionName: string, id: string, data: any) {
    return await setDoc(doc(db, collectionName, id), data);
  }

  async getDoc(collectionName: string, id: string) {
    const snapshot = await getDoc(doc(db, collectionName, id));
    return snapshot.exists() ? snapshot.data() : null;
  }

  async getAll(collectionName: string) {
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async updateDoc(collectionName: string, id: string, data: any) {
    await updateDoc(doc(db, collectionName, id), data);
    return await this.getDoc(collectionName, id);
  }

  async deleteDoc(collectionName: string, id: string) {
    return await deleteDoc(doc(db, collectionName, id));
  }
}

export { db };
