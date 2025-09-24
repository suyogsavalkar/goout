"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

export default function FirebaseTest() {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testFirestore = async () => {
    if (!user) {
      setTestResult('No user authenticated');
      return;
    }

    setLoading(true);
    setTestResult('Testing...');

    try {
      // Test write
      const testDoc = doc(db, 'test', user.uid);
      await setDoc(testDoc, {
        message: 'Hello from Firebase!',
        timestamp: new Date(),
        user: user.email
      });
      
      // Test read
      const docSnap = await getDoc(testDoc);
      
      if (docSnap.exists()) {
        setTestResult(`✅ Success! Data: ${JSON.stringify(docSnap.data(), null, 2)}`);
      } else {
        setTestResult('❌ Document not found after write');
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error.message}`);
      console.error('Firebase test error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-white border rounded-lg p-4 shadow-lg max-w-md z-50">
      <h3 className="font-bold mb-2">Firebase Test</h3>
      <Button onClick={testFirestore} disabled={loading || !user}>
        {loading ? 'Testing...' : 'Test Firestore'}
      </Button>
      {testResult && (
        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
          {testResult}
        </pre>
      )}
    </div>
  );
}