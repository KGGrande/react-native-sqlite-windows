#include "pch.h"
#include "ReactNativeSqliteWindows.h"
#include "sqlite3.h" // native SQLite C API
#include <filesystem>

namespace winrt::ReactNativeSqliteWindows
{

  void ReactNativeSqliteWindows::Initialize(React::ReactContext const& reactContext) noexcept {
    m_context = reactContext;
    OutputDebugStringW(L"ReactNativeSqliteWindows::Initialize called\n");
  }

  ReactNativeSqliteWindows::~ReactNativeSqliteWindows() {
    OutputDebugStringW(L"ReactNativeSqliteWindows::~Destructor called\n");
    for (auto& [dbName, db] : m_connections) {
      if (db) {
        OutputDebugStringW((L"Closing database: " + std::wstring(dbName.begin(), dbName.end()) + L"\n").c_str());
        sqlite3_close(db);
      }
    }
    m_connections.clear();
  }

  std::wstring ReactNativeSqliteWindows::GetDatabasePath(std::string const& name)
  {
    std::wstring wname(name.begin(), name.end());
    std::filesystem::path folder = std::filesystem::temp_directory_path();
    std::filesystem::path fullPath = folder / (wname + L".db");
    OutputDebugStringW((L"GetDatabasePath: " + fullPath.wstring() + L"\n").c_str());
    return fullPath.wstring();
  }

  void ReactNativeSqliteWindows::open(std::string dbName, React::ReactPromise<std::string>&& promise) noexcept {
    OutputDebugStringW((L"open called for database: " + std::wstring(dbName.begin(), dbName.end()) + L"\n").c_str());
    try {
      if (m_connections.find(dbName) != m_connections.end()) {
        OutputDebugStringW(L"Database already open\n");
        promise.Resolve("Database " + dbName + " already open");
        return;
      }

      std::wstring dbPath = GetDatabasePath(dbName);
      sqlite3* db = nullptr;

      int rc = sqlite3_open16(dbPath.c_str(), &db);
      if (rc != SQLITE_OK) {
        OutputDebugStringW(L"Failed to open database\n");
        promise.Reject(React::ReactError{ "Error", sqlite3_errmsg(db) });
        sqlite3_close(db);
        return;
      }

      OutputDebugStringW(L"Database opened successfully\n");
      m_connections[dbName] = db;
      promise.Resolve("Database " + dbName + " opened successfully");
    }
    catch (const std::exception& ex) {
      OutputDebugStringW((L"Exception in open\n"));

      promise.Reject(React::ReactError{ "Error", ex.what() });
    }
  }

  void ReactNativeSqliteWindows::close(std::string dbName, React::ReactPromise<std::string>&& promise) noexcept {
    OutputDebugStringW((L"close called for database: " + std::wstring(dbName.begin(), dbName.end()) + L"\n").c_str());
    try {
      auto it = m_connections.find(dbName);
      if (it == m_connections.end()) {
        OutputDebugStringW(L"Database not open\n");
        promise.Reject(React::ReactError{ "Error", "Database " + dbName + " is not open" });
        return;
      }

      sqlite3_close(it->second);
      m_connections.erase(it);
      OutputDebugStringW(L"Database closed successfully\n");
      promise.Resolve("Database " + dbName + " closed successfully");
    }
    catch (const std::exception& ex) {
      OutputDebugStringW((L"Exception in close\n"));
      promise.Reject(React::ReactError{ "Error", ex.what() });
    }
  }

  void ReactNativeSqliteWindows::executeSql(
    std::string dbName,
    std::string sql,
    React::JSValueArray args,
    React::ReactPromise<ReactNativeSqliteWindowsCodegen::ReactNativeSqliteWindowsSpec_executeSql_returnType>&& promise
  ) noexcept {
    OutputDebugStringW((L"executeSql called for database: " + std::wstring(dbName.begin(), dbName.end()) + L"\n").c_str());
    try {
      auto it = m_connections.find(dbName);
      if (it == m_connections.end()) {
        OutputDebugStringW(L"Database not open\n");
        promise.Reject(React::ReactError{ "Error", "Database " + dbName + " is not open" });
        return;
      }

      sqlite3* db = it->second;
      sqlite3_stmt* stmt = nullptr;

      int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
      if (rc != SQLITE_OK) {
        OutputDebugStringW(L"Failed to prepare statement\n");
        promise.Reject(React::ReactError{ "Error", sqlite3_errmsg(db) });
        return;
      }

      // Bind parameters
      for (int i = 0; i < static_cast<int>(args.size()); i++) {
        const auto& arg = args[i];
        int index = i + 1;
        if (arg.IsNull()) {
          sqlite3_bind_null(stmt, index);
        }
        else if (arg.Type() == React::JSValueType::String) {
          auto str = arg.AsString();
          sqlite3_bind_text(stmt, index, str.c_str(), -1, SQLITE_TRANSIENT);
        }
        else {
          sqlite3_bind_double(stmt, index, arg.AsDouble());
        }
      }

      React::JSValueArray rows;
      int stepResult;
      while ((stepResult = sqlite3_step(stmt)) == SQLITE_ROW) {
        React::JSValueObject row;
        int columnCount = sqlite3_column_count(stmt);

        for (int i = 0; i < columnCount; i++) {
          std::string colName = sqlite3_column_name(stmt, i);
          int colType = sqlite3_column_type(stmt, i);

          switch (colType) {
          case SQLITE_INTEGER:
            row[colName] = static_cast<double>(sqlite3_column_int64(stmt, i));
            break;
          case SQLITE_FLOAT:
            row[colName] = sqlite3_column_double(stmt, i);
            break;
          case SQLITE_TEXT:
            row[colName] = reinterpret_cast<const char*>(sqlite3_column_text(stmt, i));
            break;
          case SQLITE_NULL:
          default:
            row[colName] = nullptr;
            break;
          }
        }
        rows.push_back(std::move(row));
      }

      int rowsAffected = sqlite3_changes(db);
      double insertId = static_cast<double>(sqlite3_last_insert_rowid(db));

      sqlite3_finalize(stmt);
      OutputDebugStringW((L"executeSql finished\n"));

      ReactNativeSqliteWindowsCodegen::ReactNativeSqliteWindowsSpec_executeSql_returnType result;
      result.rows = std::move(rows);
      result.rowsAffected = rowsAffected;
      result.insertId = insertId;

      promise.Resolve(std::move(result));
    }
    catch (const std::exception& ex) {
      OutputDebugStringW((L"Exception in executeSql\n"));
      promise.Reject(React::ReactError{ "Error", ex.what() });
    }
  }

  void ReactNativeSqliteWindows::deleteDatabase(std::string dbName, React::ReactPromise<std::string>&& promise) noexcept {
    OutputDebugStringW((L"deleteDatabase called for: " + std::wstring(dbName.begin(), dbName.end()) + L"\n").c_str());
    try {
      auto it = m_connections.find(dbName);
      if (it != m_connections.end()) {
        sqlite3_close(it->second);
        m_connections.erase(it);
      }

      std::wstring dbPath = GetDatabasePath(dbName);
      if (DeleteFileW(dbPath.c_str())) {
        OutputDebugStringW(L"Database file deleted successfully\n");
        promise.Resolve("Database " + dbName + " deleted successfully");
      }
      else {
        OutputDebugStringW(L"Failed to delete database file\n");
        promise.Reject(React::ReactError{ "Error", "Failed to delete database file" });
      }
    }
    catch (const std::exception& ex) {
      OutputDebugStringW(L"Exception in deleteDatabase\n");
      promise.Reject(React::ReactError{ "Error", ex.what() });
    }
  }

} // namespace winrt::ReactNativeSqliteWindows
