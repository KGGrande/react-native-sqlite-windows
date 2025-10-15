#pragma once

#include "pch.h"
#include "resource.h"

#if __has_include("codegen/NativeReactNativeSqliteWindowsDataTypes.g.h")
  #include "codegen/NativeReactNativeSqliteWindowsDataTypes.g.h"
#endif
#include "codegen/NativeReactNativeSqliteWindowsSpec.g.h"

#include "NativeModules.h"
#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Storage.h>
#include <winsqlite/winsqlite3.h>
#include <map>
#include <string>
#include <vector>

namespace winrt::ReactNativeSqliteWindows
{

// See https://microsoft.github.io/react-native-windows/docs/native-platform for help writing native modules

REACT_MODULE(ReactNativeSqliteWindows)
struct ReactNativeSqliteWindows
{
  using ModuleSpec = ReactNativeSqliteWindowsCodegen::ReactNativeSqliteWindowsSpec;

  REACT_INIT(Initialize)
  void Initialize(React::ReactContext const &reactContext) noexcept;
~ReactNativeSqliteWindows();
  REACT_METHOD(open)
  void open(std::string dbName, React::ReactPromise<std::string> &&promise) noexcept;

  REACT_METHOD(close)
  void close(std::string dbName, React::ReactPromise<std::string> &&promise) noexcept;

REACT_METHOD(executeSql)
void executeSql(
    std::string dbName,
    std::string sql,
    React::JSValueArray args,
    React::ReactPromise<ReactNativeSqliteWindowsCodegen::ReactNativeSqliteWindowsSpec_executeSql_returnType> &&promise) noexcept;


  REACT_METHOD(deleteDatabase)
  void deleteDatabase(std::string dbName, React::ReactPromise<std::string> &&promise) noexcept;

private:
  React::ReactContext m_context;
  std::map<std::string, sqlite3*> m_connections;

  std::wstring GetDatabasePath(const std::string &dbName);
  std::string WStringToString(const std::wstring &wstr);
  std::wstring StringToWString(const std::string &str);
};

} // namespace winrt::ReactNativeSqliteWindows

