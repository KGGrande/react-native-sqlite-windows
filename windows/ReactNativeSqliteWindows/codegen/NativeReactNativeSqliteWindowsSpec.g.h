
/*
 * This file is auto-generated from a NativeModule spec file in js.
 *
 * This is a C++ Spec class that should be used with MakeTurboModuleProvider to register native modules
 * in a way that also verifies at compile time that the native module matches the interface required
 * by the TurboModule JS spec.
 */
#pragma once
// clang-format off

#include <NativeModules.h>
#include <tuple>

namespace ReactNativeSqliteWindowsCodegen {

struct ReactNativeSqliteWindowsSpec_executeSql_returnType {
    ::React::JSValueArray rows;
    double rowsAffected;
    double insertId;
};


inline winrt::Microsoft::ReactNative::FieldMap GetStructInfo(ReactNativeSqliteWindowsSpec_executeSql_returnType*) noexcept {
    winrt::Microsoft::ReactNative::FieldMap fieldMap {
        {L"rows", &ReactNativeSqliteWindowsSpec_executeSql_returnType::rows},
        {L"rowsAffected", &ReactNativeSqliteWindowsSpec_executeSql_returnType::rowsAffected},
        {L"insertId", &ReactNativeSqliteWindowsSpec_executeSql_returnType::insertId},
    };
    return fieldMap;
}

struct ReactNativeSqliteWindowsSpec : winrt::Microsoft::ReactNative::TurboModuleSpec {
  static constexpr auto methods = std::tuple{
      Method<void(std::string, Promise<std::string>) noexcept>{0, L"open"},
      Method<void(std::string, Promise<std::string>) noexcept>{1, L"close"},
      Method<void(std::string, std::string, ::React::JSValueArray, Promise<ReactNativeSqliteWindowsSpec_executeSql_returnType>) noexcept>{2, L"executeSql"},
      Method<void(std::string, Promise<std::string>) noexcept>{3, L"deleteDatabase"},
  };

  template <class TModule>
  static constexpr void ValidateModule() noexcept {
    constexpr auto methodCheckResults = CheckMethods<TModule, ReactNativeSqliteWindowsSpec>();

    REACT_SHOW_METHOD_SPEC_ERRORS(
          0,
          "open",
          "    REACT_METHOD(open) void open(std::string dbName, ::React::ReactPromise<std::string> &&result) noexcept { /* implementation */ }\n"
          "    REACT_METHOD(open) static void open(std::string dbName, ::React::ReactPromise<std::string> &&result) noexcept { /* implementation */ }\n");
    REACT_SHOW_METHOD_SPEC_ERRORS(
          1,
          "close",
          "    REACT_METHOD(close) void close(std::string dbName, ::React::ReactPromise<std::string> &&result) noexcept { /* implementation */ }\n"
          "    REACT_METHOD(close) static void close(std::string dbName, ::React::ReactPromise<std::string> &&result) noexcept { /* implementation */ }\n");
    REACT_SHOW_METHOD_SPEC_ERRORS(
          2,
          "executeSql",
          "    REACT_METHOD(executeSql) void executeSql(std::string dbName, std::string sql, ::React::JSValueArray && args, ::React::ReactPromise<ReactNativeSqliteWindowsSpec_executeSql_returnType> &&result) noexcept { /* implementation */ }\n"
          "    REACT_METHOD(executeSql) static void executeSql(std::string dbName, std::string sql, ::React::JSValueArray && args, ::React::ReactPromise<ReactNativeSqliteWindowsSpec_executeSql_returnType> &&result) noexcept { /* implementation */ }\n");
    REACT_SHOW_METHOD_SPEC_ERRORS(
          3,
          "deleteDatabase",
          "    REACT_METHOD(deleteDatabase) void deleteDatabase(std::string dbName, ::React::ReactPromise<std::string> &&result) noexcept { /* implementation */ }\n"
          "    REACT_METHOD(deleteDatabase) static void deleteDatabase(std::string dbName, ::React::ReactPromise<std::string> &&result) noexcept { /* implementation */ }\n");
  }
};

} // namespace ReactNativeSqliteWindowsCodegen
