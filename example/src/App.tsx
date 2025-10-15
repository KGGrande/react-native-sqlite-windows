// File: App.tsx
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Button,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { openDatabase, SQLiteDatabase } from 'react-native-sqlite-windows';

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  // created_at: string;
}

const App = () => {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Not initialized');

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');

  // Initialize database
  const initDatabase = async () => {
    try {
      setLoading(true);
      setStatus('Opening database...');

      const database = openDatabase('test.db');
      await database.open();

      setStatus('Creating tables...');

      // Create users table
      await database.executeSql(
        `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          age INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
        []
      );

      // Create audit log table
      await database.executeSql(
        `
        CREATE TABLE IF NOT EXISTS audit_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          action TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
        []
      );

      setDb(database);
      setStatus('Database initialized successfully!');
      await loadUsers(database);
    } catch (error) {
      setStatus(`Error: ${error}`);
      Alert.alert('Database Error', String(error));
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (database: SQLiteDatabase = db!) => {
    if (!database) return;

    try {
      setLoading(true);
      const result = await database.executeSql(
        'SELECT * FROM users ORDER BY created_at DESC',
        []
      );
      console.log(result);
      // Normalize rows to match User interface
      const normalizedRows: User[] = (result.rows as any[]).map((r) => ({
        id: r.id ?? 0,
        name: r.name ?? '',
        email: r.email ?? '',
        age: r.age ?? 0,
        // created_at: r.created_at ?? new Date().toISOString(),
      }));

      setUsers(normalizedRows);
      setStatus(`Loaded ${normalizedRows.length} users`);
    } catch (error) {
      setStatus(`Error loading users: ${error}`);
      Alert.alert('Load Error', String(error));
    } finally {
      setLoading(false);
    }
  };

  // Insert new user
  const addUser = async () => {
    if (!db) {
      Alert.alert('Error', 'Database not initialized');
      return;
    }

    if (!name || !email || !age) {
      Alert.alert('Validation Error', 'Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      const result = await db.executeSql(
        'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
        [name, email, parseInt(age)]
      );

      // Ensure insertId is valid number
      const insertId = result.insertId ?? 0;

      setStatus(`User added with ID: ${insertId}`);
      Alert.alert('Success', `User ${name} added with ID ${insertId}`);

      // Clear form
      setName('');
      setEmail('');
      setAge('');

      await loadUsers();
    } catch (error) {
      setStatus(`Error adding user: ${error}`);
      Alert.alert('Insert Error', String(error));
    } finally {
      setLoading(false);
    }
  };

  // Update user
  // const updateUser = async (id: number, newName: string) => {
  //   if (!db) return;

  //   try {
  //     setLoading(true);
  //     const result = await db.executeSql(
  //       'UPDATE users SET name = ? WHERE id = ?',
  //       [newName, id]
  //     );

  //     setStatus(`Updated ${result.rowsAffected} user(s)`);
  //     Alert.alert('Success', `User updated successfully`);
  //     await loadUsers();
  //   } catch (error) {
  //     setStatus(`Error updating user: ${error}`);
  //     Alert.alert('Update Error', String(error));
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Delete user
  const deleteUser = async (id: number, userName: string) => {
    if (!db) return;

    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await db.executeSql(
                'DELETE FROM users WHERE id = ?',
                [id]
              );

              setStatus(`Deleted ${result.rowsAffected} user(s)`);
              await loadUsers();
            } catch (error) {
              setStatus(`Error deleting user: ${error}`);
              Alert.alert('Delete Error', String(error));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Test transactions
  const testTransaction = async () => {
    if (!db) return;

    try {
      setLoading(true);
      setStatus('Testing transaction...');

      await db.transaction(async (tx) => {
        // Insert multiple users
        await tx.executeSql(
          'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
          ['Transaction User 1', 'tx1@test.com', 25]
        );

        await tx.executeSql(
          'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
          ['Transaction User 2', 'tx2@test.com', 30]
        );

        // Log the action
        await tx.executeSql('INSERT INTO audit_log (action) VALUES (?)', [
          'bulk_user_insert',
        ]);
      });

      setStatus('Transaction completed successfully!');
      Alert.alert('Success', 'Transaction test completed');
      await loadUsers();
    } catch (error) {
      setStatus(`Transaction failed: ${error}`);
      Alert.alert('Transaction Error', String(error));
    } finally {
      setLoading(false);
    }
  };

  // Test failed transaction (should rollback)
  const testFailedTransaction = async () => {
    if (!db) return;

    try {
      setLoading(true);
      setStatus('Testing failed transaction...');

      await db.transaction(async (tx) => {
        await tx.executeSql(
          'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
          ['Will Rollback', 'rollback@test.com', 40]
        );

        // This will fail due to duplicate email if run twice
        await tx.executeSql(
          'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
          ['Duplicate Email', 'tx1@test.com', 35] // Duplicate email!
        );
      });

      setStatus('Transaction unexpectedly succeeded');
    } catch (error) {
      setStatus('Transaction rolled back as expected!');
      Alert.alert(
        'Transaction Rollback',
        'Transaction failed and rolled back successfully'
      );
    } finally {
      setLoading(false);
      await loadUsers();
    }
  };

  // Search users
  const searchUsers = async (searchTerm: string) => {
    if (!db || !searchTerm) {
      await loadUsers();
      return;
    }

    try {
      setLoading(true);
      const result = await db.executeSql(
        'SELECT * FROM users WHERE name LIKE ? OR email LIKE ?',
        [`%${searchTerm}%`, `%${searchTerm}%`]
      );

      setUsers(result.rows as User[]);
      setStatus(`Found ${result.rows.length} matching users`);
    } catch (error) {
      setStatus(`Error searching: ${error}`);
      Alert.alert('Search Error', String(error));
    } finally {
      setLoading(false);
    }
  };

  // Get statistics
  const showStats = async () => {
    if (!db) return;

    try {
      setLoading(true);

      const countResult = await db.executeSql(
        'SELECT COUNT(*) as total FROM users',
        []
      );

      const avgAgeResult = await db.executeSql(
        'SELECT AVG(age) as avg_age FROM users',
        []
      );

      const oldestResult = await db.executeSql(
        'SELECT * FROM users ORDER BY age DESC LIMIT 1',
        []
      );

      const total = countResult.rows[0]?.total || 0;
      const avgAge = avgAgeResult.rows[0]?.avg_age?.toFixed(1) || 0;
      const oldest = oldestResult.rows[0];

      Alert.alert(
        'Statistics',
        `Total Users: ${total}\n` +
          `Average Age: ${avgAge}\n` +
          `Oldest User: ${oldest ? `${oldest.name} (${oldest.age})` : 'N/A'}`
      );

      setStatus('Statistics calculated');
    } catch (error) {
      Alert.alert('Stats Error', String(error));
    } finally {
      setLoading(false);
    }
  };

  // Close database
  const closeDatabase = async () => {
    if (!db) return;

    try {
      setLoading(true);
      await db.close();
      setDb(null);
      setUsers([]);
      setStatus('Database closed');
    } catch (error) {
      setStatus(`Error closing database: ${error}`);
      Alert.alert('Close Error', String(error));
    } finally {
      setLoading(false);
    }
  };

  // Delete database
  const deleteDatabase = async () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete the entire database?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              if (db) {
                await db.close();
              }
              await SQLiteDatabase.deleteDatabase('test.db');
              setDb(null);
              setUsers([]);
              setStatus('Database deleted');
              Alert.alert('Success', 'Database deleted successfully');
            } catch (error) {
              setStatus(`Error deleting database: ${error}`);
              Alert.alert('Delete Error', String(error));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>SQLite Module Test</Text>

        <View style={styles.statusBar}>
          <Text style={styles.statusText}>Status: {status}</Text>
          {loading && <ActivityIndicator size="small" color="#007AFF" />}
        </View>

        {/* Database Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Database Controls</Text>
          <View style={styles.buttonRow}>
            <Button title="Init DB" onPress={initDatabase} disabled={!!db} />
            <Button
              title="Refresh"
              onPress={() => loadUsers()}
              disabled={!db}
            />
            <Button title="Stats" onPress={showStats} disabled={!db} />
          </View>
          <View style={styles.buttonRow}>
            <Button title="Close DB" onPress={closeDatabase} disabled={!db} />
            <Button title="Delete DB" onPress={deleteDatabase} color="red" />
          </View>
        </View>

        {/* Add User Form */}
        {db && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add New User</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Age"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
            <Button title="Add User" onPress={addUser} />
          </View>
        )}

        {/* Search */}
        {db && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search</Text>
            <TextInput
              style={styles.input}
              placeholder="Search by name or email"
              onChangeText={searchUsers}
            />
          </View>
        )}

        {/* Transaction Tests */}
        {db && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction Tests</Text>
            <View style={styles.buttonRow}>
              <Button title="Test Success" onPress={testTransaction} />
              <Button title="Test Rollback" onPress={testFailedTransaction} />
            </View>
          </View>
        )}

        {/* Users List */}
        {db && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Users ({users.length})</Text>
            {users.length === 0 ? (
              <Text style={styles.emptyText}>No users found</Text>
            ) : (
              users.map((user) => (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userDetail}>Email: {user.email}</Text>
                    <Text style={styles.userDetail}>Age: {user.age}</Text>
                  </View>
                  <View style={styles.userActions}>
                    {/* <Button
                      title="Edit"
                      onPress={() => {
                        Alert.alert('Update Name', 'Enter new name:', (text) =>
                          updateUser(user.id, text)
                        );
                      }}
                    /> */}
                    <Button
                      title="Delete"
                      color="red"
                      onPress={() => deleteUser(user.id, user.name)}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  userCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  userInfo: {
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    padding: 20,
  },
});

export default App;
