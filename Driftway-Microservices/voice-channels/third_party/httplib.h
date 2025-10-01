//
// httplib.h
//
// Copyright (c) 2025 Yuji Hirose. All rights reserved.
// MIT License
//
#ifndef CPPHTTPLIB_HTTPLIB_H
#define CPPHTTPLIB_HTTPLIB_H

#define CPPHTTPLIB_VERSION "0.26.0"
#define CPPHTTPLIB_VERSION_NUM "0x001A00"

/*
 * Platform compatibility check
 */
#if defined(_WIN32) && !defined(_WIN64)
#if defined(_MSC_VER)
#pragma message( \
    "cpp-httplib doesn't support 32-bit Windows. Please use a 64-bit compiler.")
#else
#warning \
    "cpp-httplib doesn't support 32-bit Windows. Please use a 64-bit compiler."
#endif
#elif defined(__SIZEOF_POINTER__) && __SIZEOF_POINTER__ < 8
#warning \
    "cpp-httplib doesn't support 32-bit platforms. Please use a 64-bit compiler."
#elif defined(__SIZEOF_SIZE_T__) && __SIZEOF_SIZE_T__ < 8
#warning \
    "cpp-httplib doesn't support platforms where size_t is less than 64 bits."
#endif

#ifdef _WIN32
#if defined(_WIN32_WINNT) && _WIN32_WINNT < 0x0A00
#error \
    "cpp-httplib doesn't support Windows 8 or lower. Please use Windows 10 or later."
#endif
#endif

/*
 * Configuration
 */

#ifndef CPPHTTPLIB_KEEPALIVE_TIMEOUT_SECOND
#define CPPHTTPLIB_KEEPALIVE_TIMEOUT_SECOND 5
#endif

#ifndef CPPHTTPLIB_KEEPALIVE_TIMEOUT_CHECK_INTERVAL_USECOND
#define CPPHTTPLIB_KEEPALIVE_TIMEOUT_CHECK_INTERVAL_USECOND 10000
#endif

#ifndef CPPHTTPLIB_KEEPALIVE_MAX_COUNT
#define CPPHTTPLIB_KEEPALIVE_MAX_COUNT 100
#endif

#ifndef CPPHTTPLIB_CONNECTION_TIMEOUT_SECOND
#define CPPHTTPLIB_CONNECTION_TIMEOUT_SECOND 300
#endif

#ifndef CPPHTTPLIB_CONNECTION_TIMEOUT_USECOND
#define CPPHTTPLIB_CONNECTION_TIMEOUT_USECOND 0
#endif

#ifndef CPPHTTPLIB_SERVER_READ_TIMEOUT_SECOND
#define CPPHTTPLIB_SERVER_READ_TIMEOUT_SECOND 5
#endif

#ifndef CPPHTTPLIB_SERVER_READ_TIMEOUT_USECOND
#define CPPHTTPLIB_SERVER_READ_TIMEOUT_USECOND 0
#endif

#ifndef CPPHTTPLIB_SERVER_WRITE_TIMEOUT_SECOND
#define CPPHTTPLIB_SERVER_WRITE_TIMEOUT_SECOND 5
#endif

#ifndef CPPHTTPLIB_SERVER_WRITE_TIMEOUT_USECOND
#define CPPHTTPLIB_SERVER_WRITE_TIMEOUT_USECOND 0
#endif

#ifndef CPPHTTPLIB_CLIENT_READ_TIMEOUT_SECOND
#define CPPHTTPLIB_CLIENT_READ_TIMEOUT_SECOND 300
#endif

#ifndef CPPHTTPLIB_CLIENT_READ_TIMEOUT_USECOND
#define CPPHTTPLIB_CLIENT_READ_TIMEOUT_USECOND 0
#endif

#ifndef CPPHTTPLIB_CLIENT_WRITE_TIMEOUT_SECOND
#define CPPHTTPLIB_CLIENT_WRITE_TIMEOUT_SECOND 5
#endif

#ifndef CPPHTTPLIB_CLIENT_WRITE_TIMEOUT_USECOND
#define CPPHTTPLIB_CLIENT_WRITE_TIMEOUT_USECOND 0
#endif

#ifndef CPPHTTPLIB_CLIENT_MAX_TIMEOUT_MSECOND
#define CPPHTTPLIB_CLIENT_MAX_TIMEOUT_MSECOND 0
#endif

#ifndef CPPHTTPLIB_IDLE_INTERVAL_SECOND
#define CPPHTTPLIB_IDLE_INTERVAL_SECOND 0
#endif

#ifndef CPPHTTPLIB_IDLE_INTERVAL_USECOND
#ifdef _WIN32
#define CPPHTTPLIB_IDLE_INTERVAL_USECOND 1000
#else
#define CPPHTTPLIB_IDLE_INTERVAL_USECOND 0
#endif
#endif

#ifndef CPPHTTPLIB_REQUEST_URI_MAX_LENGTH
#define CPPHTTPLIB_REQUEST_URI_MAX_LENGTH 8192
#endif

#ifndef CPPHTTPLIB_HEADER_MAX_LENGTH
#define CPPHTTPLIB_HEADER_MAX_LENGTH 8192
#endif

#ifndef CPPHTTPLIB_HEADER_MAX_COUNT
#define CPPHTTPLIB_HEADER_MAX_COUNT 100
#endif

#ifndef CPPHTTPLIB_REDIRECT_MAX_COUNT
#define CPPHTTPLIB_REDIRECT_MAX_COUNT 20
#endif

#ifndef CPPHTTPLIB_MULTIPART_FORM_DATA_FILE_MAX_COUNT
#define CPPHTTPLIB_MULTIPART_FORM_DATA_FILE_MAX_COUNT 1024
#endif

#ifndef CPPHTTPLIB_PAYLOAD_MAX_LENGTH
#define CPPHTTPLIB_PAYLOAD_MAX_LENGTH ((std::numeric_limits<size_t>::max)())
#endif

#ifndef CPPHTTPLIB_FORM_URL_ENCODED_PAYLOAD_MAX_LENGTH
#define CPPHTTPLIB_FORM_URL_ENCODED_PAYLOAD_MAX_LENGTH 8192
#endif

#ifndef CPPHTTPLIB_RANGE_MAX_COUNT
#define CPPHTTPLIB_RANGE_MAX_COUNT 1024
#endif

#ifndef CPPHTTPLIB_TCP_NODELAY
#define CPPHTTPLIB_TCP_NODELAY false
#endif

#ifndef CPPHTTPLIB_IPV6_V6ONLY
#define CPPHTTPLIB_IPV6_V6ONLY false
#endif

#ifndef CPPHTTPLIB_RECV_BUFSIZ
#define CPPHTTPLIB_RECV_BUFSIZ size_t(16384u)
#endif

#ifndef CPPHTTPLIB_SEND_BUFSIZ
#define CPPHTTPLIB_SEND_BUFSIZ size_t(16384u)
#endif

#ifndef CPPHTTPLIB_COMPRESSION_BUFSIZ
#define CPPHTTPLIB_COMPRESSION_BUFSIZ size_t(16384u)
#endif

#ifndef CPPHTTPLIB_THREAD_POOL_COUNT
#define CPPHTTPLIB_THREAD_POOL_COUNT \
  ((std::max)(8u, std::thread::hardware_concurrency() > 0 \
                      ? std::thread::hardware_concurrency() - 1 \
                      : 0))
#endif

#ifndef CPPHTTPLIB_RECV_FLAGS
#define CPPHTTPLIB_RECV_FLAGS 0
#endif

#ifndef CPPHTTPLIB_SEND_FLAGS
#define CPPHTTPLIB_SEND_FLAGS 0
#endif

#ifndef CPPHTTPLIB_LISTEN_BACKLOG
#define CPPHTTPLIB_LISTEN_BACKLOG 5
#endif

#ifndef CPPHTTPLIB_MAX_LINE_LENGTH
#define CPPHTTPLIB_MAX_LINE_LENGTH 32768
#endif

/*
 * Headers
 */

#ifdef _WIN32
#ifndef _CRT_SECURE_NO_WARNINGS
#define _CRT_SECURE_NO_WARNINGS
#endif //_CRT_SECURE_NO_WARNINGS

#ifndef _CRT_NONSTDC_NO_DEPRECATE
#define _CRT_NONSTDC_NO_DEPRECATE
#endif //_CRT_NONSTDC_NO_DEPRECATE

#if defined(_MSC_VER)
#if _MSC_VER < 1900
#error Sorry, Visual Studio versions prior to 2015 are not supported
#endif

#pragma comment(lib, "ws2_32.lib")

using ssize_t = __int64;
#endif // _MSC_VER

#ifndef S_ISREG
#define S_ISREG(m) (((m) & S_IFREG) == S_IFREG)
#endif // S_ISREG

#ifndef S_ISDIR
#define S_ISDIR(m) (((m) & S_IFDIR) == S_IFDIR)
#endif // S_ISDIR

#ifndef NOMINMAX
#define NOMINMAX
#endif // NOMINMAX

#include <io.h>
#include <winsock2.h>
#include <ws2tcpip.h>

#if defined(__has_include)
#if __has_include(<afunix.h>)
// afunix.h uses types declared in winsock2.h, so has to be included after it.
#include <afunix.h>
#define CPPHTTPLIB_HAVE_AFUNIX_H 1
#endif
#endif

#ifndef WSA_FLAG_NO_HANDLE_INHERIT
#define WSA_FLAG_NO_HANDLE_INHERIT 0x80
#endif

using nfds_t = unsigned long;
using socket_t = SOCKET;
using socklen_t = int;
#else // not _WIN32
#include <arpa/inet.h>
#if !defined(_AIX) && !defined(__MVS__)
#include <ifaddrs.h>
#endif
#ifdef __MVS__
#include <strings.h>
#ifndef NI_MAXHOST
#define NI_MAXHOST 1025
#endif
#endif
#include <net/if.h>
#include <netdb.h>
#include <netinet/in.h>
#ifdef __linux__
#include <resolv.h>
#endif
#include <csignal>
#include <netinet/tcp.h>
#include <poll.h>
#include <pthread.h>
#include <sys/mman.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>

using socket_t = int;
#ifndef INVALID_SOCKET
#define INVALID_SOCKET (-1)
#endif
#endif //_WIN32

#if defined(__APPLE__)
#include <TargetConditionals.h>
#endif

#include <algorithm>
#include <array>
#include <atomic>
#include <cassert>
#include <cctype>
#include <climits>
#include <condition_variable>
#include <cstring>
#include <errno.h>
#include <exception>
#include <fcntl.h>
#include <functional>
#include <iomanip>
#include <iostream>
#include <list>
#include <map>
#include <memory>
#include <mutex>
#include <random>
#include <regex>
#include <set>
#include <sstream>
#include <string>
#include <sys/stat.h>
#include <thread>
#include <unordered_map>
#include <unordered_set>
#include <utility>

#if defined(CPPHTTPLIB_USE_NON_BLOCKING_GETADDRINFO) || \
    defined(CPPHTTPLIB_USE_CERTS_FROM_MACOSX_KEYCHAIN)
#if TARGET_OS_MAC
#include <CFNetwork/CFHost.h>
#include <CoreFoundation/CoreFoundation.h>
#endif
#endif // CPPHTTPLIB_USE_NON_BLOCKING_GETADDRINFO or
       // CPPHTTPLIB_USE_CERTS_FROM_MACOSX_KEYCHAIN

#ifdef CPPHTTPLIB_OPENSSL_SUPPORT
#ifdef _WIN32
#include <wincrypt.h>

// these are defined in wincrypt.h and it breaks compilation if BoringSSL is
// used
#undef X509_NAME
#undef X509_CERT_PAIR
#undef X509_EXTENSIONS
#undef PKCS7_SIGNER_INFO

#ifdef _MSC_VER
#pragma comment(lib, "crypt32.lib")
#endif
#endif // _WIN32

#if defined(CPPHTTPLIB_USE_CERTS_FROM_MACOSX_KEYCHAIN)
#if TARGET_OS_MAC
#include <Security/Security.h>
#endif
#endif // CPPHTTPLIB_USE_NON_BLOCKING_GETADDRINFO

#include <openssl/err.h>
#include <openssl/evp.h>
#include <openssl/ssl.h>
#include <openssl/x509v3.h>

#if defined(_WIN32) && defined(OPENSSL_USE_APPLINK)
#include <openssl/applink.c>
#endif

#include <iostream>
#include <sstream>

#if defined(OPENSSL_IS_BORINGSSL) || defined(LIBRESSL_VERSION_NUMBER)
#if OPENSSL_VERSION_NUMBER < 0x1010107f
#error Please use OpenSSL or a current version of BoringSSL
#endif
#define SSL_get1_peer_certificate SSL_get_peer_certificate
#elif OPENSSL_VERSION_NUMBER < 0x30000000L
#error Sorry, OpenSSL versions prior to 3.0.0 are not supported
#endif

#endif // CPPHTTPLIB_OPENSSL_SUPPORT

#ifdef CPPHTTPLIB_ZLIB_SUPPORT
#include <zlib.h>
#endif

#ifdef CPPHTTPLIB_BROTLI_SUPPORT
#include <brotli/decode.h>
#include <brotli/encode.h>
#endif

#ifdef CPPHTTPLIB_ZSTD_SUPPORT
#include <zstd.h>
#endif

/*
 * Declaration
 */
namespace httplib {

namespace detail {

/*
 * Backport std::make_unique from C++14.
 *
 * NOTE: This code came up with the following stackoverflow post:
 * https://stackoverflow.com/questions/10149840/c-arrays-and-make-unique
 * */
template <class T, class... Args>
typename std::enable_if<!std::is_array<T>::value, std::unique_ptr<T>>::type
make_unique(Args &&...args) {
  return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}

template <class T>
typename std::enable_if<std::is_array<T>::value, std::unique_ptr<T>>::type
make_unique(std::size_t n) {
  typedef typename std::remove_extent<T>::type RT;
  return std::unique_ptr<T>(new RT[n]);
}

namespace case_ignore {

inline unsigned char to_lower(int c) {
  const static unsigned char table[256] = {
      0,   1,   2,   3,   4,   5,   6,   7,   8,   9,   10,  11,  12,  13,  14,
      15,  16,  17,  18,  19,  20,  21,  22,  23,  24,  25,  26,  27,  28,  29,
      30,  31,  32,  33,  34,  35,  36,  37,  38,  39,  40,  41,  42,  43,  44,
      45,  46,  47,  48,  49,  50,  51,  52,  53,  54,  55,  56,  57,  58,  59,
      60,  61,  62,  63,  64,  97,  98,  99,  100, 101, 102, 103, 104, 105, 106,
      107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121,
      122, 91,  92,  93,  94,  95,  96,  97,  98,  99,  100, 101, 102, 103, 104,
      105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119,
      120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134,
      135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149,
      150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164,
      165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179,
      180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 224, 225, 226,
      227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241,
      242, 243, 244, 245, 246, 215, 248, 249, 250, 251, 252, 253, 254, 223, 224,
      225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239,
      240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254,
      255,
  };
  return table[(unsigned char)(char)c];
}

inline bool equal(const std::string &a, const std::string &b) {
  return a.size() == b.size() &&
         std::equal(a.begin(), a.end(), b.begin(),
                    [](char ca, char cb) { return to_lower(ca) == to_lower(cb); });
}

struct equal_to {
  bool operator()(const std::string &a, const std::string &b) const {
    return equal(a, b);
  }
};

struct hash {
  size_t operator()(const std::string &key) const {
    return hash_core(key.data(), key.size(), 0);
  }

  size_t hash_core(const char *s, size_t l, size_t h) const {
    return (l == 0)
               ? h
               : hash_core(s + 1, l - 1,
                           // Unsets the 6 high bits of h, therefore no
                           // overflow happens
                           (((std::numeric_limits<size_t>::max)() >> 6) & h * 33) ^
                               static_cast<unsigned char>(to_lower(*s)));
  }
};

template <typename T>
using unordered_set = 
    std::unordered_set<T, detail::case_ignore::hash,
                       detail::case_ignore::equal_to>;

} // namespace case_ignore

// This is based on
// "http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2014/n4189".
struct scope_exit {
  explicit scope_exit(std::function<void(void)> &&f)
      : exit_function(std::move(f)), execute_on_destruction{true} {}

  scope_exit(scope_exit &&rhs) noexcept
      : exit_function(std::move(rhs.exit_function)),
        execute_on_destruction{rhs.execute_on_destruction} {
    rhs.release();
  }

  ~scope_exit() {
    if (execute_on_destruction) { this->exit_function(); }
  }

  void release() { this->execute_on_destruction = false; }

private:
  scope_exit(const scope_exit &) = delete;
  void operator=(const scope_exit &) = delete;
  scope_exit &operator=(scope_exit &&) = delete;

  std::function<void(void)> exit_function;
  bool execute_on_destruction;
};

} // namespace detail

enum SSLVerifierResponse {
  // no decision has been made, use the built-in certificate verifier
  NoDecisionMade,
  // connection certificate is verified and accepted
  CertificateAccepted,
  // connection certificate was processed but is rejected
  CertificateRejected
};

enum StatusCode {
  // Information responses
  Continue_100 = 100,
  SwitchingProtocol_101 = 101,
  Processing_102 = 102,
  EarlyHints_103 = 103,

  // Successful responses
  OK_200 = 200,
  Created_201 = 201,
  Accepted_202 = 202,
  NonAuthoritativeInformation_203 = 203,
  NoContent_204 = 204,
  ResetContent_205 = 205,
  PartialContent_206 = 206,
  MultiStatus_207 = 207,
  AlreadyReported_208 = 208,
  IMUsed_226 = 226,

  // Redirection messages
  MultipleChoices_300 = 300,
  MovedPermanently_301 = 301,
  Found_302 = 302,
  SeeOther_303 = 303,
  NotModified_304 = 304,
  UseProxy_305 = 305,
  unused_306 = 306,
  TemporaryRedirect_307 = 307,
  PermanentRedirect_308 = 308,

  // Client error responses
  BadRequest_400 = 400,
  Unauthorized_401 = 401,
  PaymentRequired_402 = 402,
  Forbidden_403 = 403,
  NotFound_404 = 404,
  MethodNotAllowed_405 = 405,
  NotAcceptable_406 = 406,
  ProxyAuthenticationRequired_407 = 407,
  RequestTimeout_408 = 408,
  Conflict_409 = 409,
  Gone_410 = 410,
  LengthRequired_411 = 411,
  PreconditionFailed_412 = 412,
  PayloadTooLarge_413 = 413,
  UriTooLong_414 = 414,
  UnsupportedMediaType_415 = 415,
  RangeNotSatisfiable_416 = 416,
  ExpectationFailed_417 = 417,
  ImATeapot_418 = 418,
  MisdirectedRequest_421 = 421,
  UnprocessableContent_422 = 422,
  Locked_423 = 423,
  FailedDependency_424 = 424,
  TooEarly_425 = 425,
  UpgradeRequired_426 = 426,
  PreconditionRequired_428 = 428,
  TooManyRequests_429 = 429,
  RequestHeaderFieldsTooLarge_431 = 431,
  UnavailableForLegalReasons_451 = 451,

  // Server error responses
  InternalServerError_500 = 500,
  NotImplemented_501 = 501,
  BadGateway_502 = 502,
  ServiceUnavailable_503 = 503,
  GatewayTimeout_504 = 504,
  HttpVersionNotSupported_505 = 505,
  VariantAlsoNegotiates_506 = 506,
  InsufficientStorage_507 = 507,
  LoopDetected_508 = 508,
  NotExtended_510 = 510,
  NetworkAuthenticationRequired_511 = 511,
};

using Headers = 
    std::unordered_multimap<std::string, std::string, detail::case_ignore::hash,
                            detail::case_ignore::equal_to>;

using Params = std::multimap<std::string, std::string>;
using Match = std::smatch;
using DownloadProgress = std::function<bool(size_t current, size_t total)>;
using UploadProgress = std::function<bool(size_t current, size_t total)>;

struct Response;
using ResponseHandler = std::function<bool(const Response &response)>;

struct FormData {
  std::string name;
  std::string content;
  std::string filename;
  std::string content_type;
  Headers headers;
};

struct FormField {
  std::string name;
  std::string content;
  Headers headers;
};

using FormFields = std::multimap<std::string, FormField>;
using FormFiles = std::multimap<std::string, FormData>;

struct MultipartFormData {
  FormFields fields; // Text fields from multipart
  FormFiles files;   // Files from multipart

  // Text field access
  std::string get_field(const std::string &key, size_t id = 0) const;
  std::vector<std::string> get_fields(const std::string &key) const;
  bool has_field(const std::string &key) const;
  size_t get_field_count(const std::string &key) const;

  // File access
  FormData get_file(const std::string &key, size_t id = 0) const;
  std::vector<FormData> get_files(const std::string &key) const;
  bool has_file(const std::string &key) const;
  size_t get_file_count(const std::string &key) const;
};

struct UploadFormData {
  std::string name;
  std::string content;
  std::string filename;
  std::string content_type;
};

using UploadFormDataItems = std::vector<UploadFormData>;

class DataSink {
public:
  DataSink() : os(&sb_), sb_(*this) {}
  DataSink(const DataSink &) = delete;
  DataSink &operator=(const DataSink &) = delete;
  DataSink(DataSink &&) = delete;
  DataSink &operator=(DataSink &&) = delete;

  std::function<bool(const char *data, size_t data_len)> write;
  std::function<bool()> is_writable;
  std::function<void()> done;
  std::function<void(const Headers &trailer)> done_with_trailer;
  std::ostream os;

private:
  class data_sink_streambuf final : public std::streambuf {
  public:
    explicit data_sink_streambuf(DataSink &sink) : sink_(sink) {}

  protected:
    std::streamsize xsputn(const char *s, std::streamsize n) override {
      sink_.write(s, static_cast<size_t>(n));
      return n;
    }

  private:
    DataSink &sink_;
  };

  data_sink_streambuf sb_;
};

using ContentProvider = 
    std::function<bool(size_t offset, size_t length, DataSink &sink)>;

using ContentProviderWithoutLength = 
    std::function<bool(size_t offset, DataSink &sink)>;

using ContentProviderResourceReleaser = std::function<void(bool success)>;

struct FormDataProvider {
  std::string name;
  ContentProviderWithoutLength provider;
  std::string filename;
  std::string content_type;
};

using FormDataProviderItems = std::vector<FormDataProvider>;

using ContentReceiverWithProgress = 
    std::function<bool(const char *data, size_t data_length, size_t offset,
                       size_t total_length)>;

using ContentReceiver = 
    std::function<bool(const char *data, size_t data_length)>;

using FormDataHeader = std::function<bool(const FormData &file)>;

class ContentReader {
public:
  using Reader = std::function<bool(ContentReceiver receiver)>;
  using FormDataReader = 
      std::function<bool(FormDataHeader header, ContentReceiver receiver)>;

  ContentReader(Reader reader, FormDataReader multipart_reader)
      : reader_(std::move(reader)),
        formdata_reader_(std::move(multipart_reader)) {}

  bool operator()(FormDataHeader header, ContentReceiver receiver) const {
    return formdata_reader_(std::move(header), std::move(receiver));
  }

  bool operator()(ContentReceiver receiver) const {
    return reader_(std::move(receiver));
  }

  Reader reader_;
  FormDataReader formdata_reader_;
};

using Range = std::pair<ssize_t, ssize_t>;
using Ranges = std::vector<Range>;

struct Request {
  std::string method;
  std::string path;
  std::string matched_route;
  Params params;
  Headers headers;
  Headers trailers;
  std::string body;
  std::string remote_addr;
  int remote_port = -1;
  std::string local_addr;
  int local_port = -1;

  // for server
  std::string version;
  std::string target;
  MultipartFormData form;
  Ranges ranges;
  Match matches;
  std::unordered_map<std::string, std::string> path_params;
  std::function<bool()> is_connection_closed = []() { return true; };

  // for client
  std::vector<std::string> accept_content_types;
  ResponseHandler response_handler;
  ContentReceiverWithProgress content_receiver;
  DownloadProgress download_progress;
  UploadProgress upload_progress;
#ifdef CPPHTTPLIB_OPENSSL_SUPPORT
  const SSL *ssl = nullptr;
#endif

  bool has_header(const std::string &key) const;
  std::string get_header_value(const std::string &key, const char *def = "",
                               size_t id = 0) const;
  size_t get_header_value_u64(const std::string &key, size_t def = 0,
                              size_t id = 0) const;
  size_t get_header_value_count(const std::string &key) const;
  void set_header(const std::string &key, const std::string &val);

  bool has_trailer(const std::string &key) const;
  std::string get_trailer_value(const std::string &key, size_t id = 0) const;
  size_t get_trailer_value_count(const std::string &key) const;

  bool has_param(const std::string &key) const;
  std::string get_param_value(const std::string &key, size_t id = 0) const;
  size_t get_param_value_count(const std::string &key) const;

  bool is_multipart_form_data() const;

  // private members...
  size_t redirect_count_ = CPPHTTPLIB_REDIRECT_MAX_COUNT;
  size_t content_length_ = 0;
  ContentProvider content_provider_;
  bool is_chunked_content_provider_ = false;
  size_t authorization_count_ = 0;
  std::chrono::time_point<std::chrono::steady_clock> start_time_ =
      (std::chrono::steady_clock::time_point::min)();
};

struct Response {
  std::string version;
  int status = -1;
  std::string reason;
  Headers headers;
  Headers trailers;
  std::string body;
  std::string location; // Redirect location

  bool has_header(const std::string &key) const;
  std::string get_header_value(const std::string &key, const char *def = "",
                               size_t id = 0) const;
  size_t get_header_value_u64(const std::string &key, size_t def = 0,
                              size_t id = 0) const;
  size_t get_header_value_count(const std::string &key) const;
  void set_header(const std::string &key, const std::string &val);

  bool has_trailer(const std::string &key) const;
  std::string get_trailer_value(const std::string &key, size_t id = 0) const;
  size_t get_trailer_value_count(const std::string &key) const;

  void set_redirect(const std::string &url,
                    int status = StatusCode::Found_302);
  void set_content(const char *s, size_t n, const std::string &content_type);
  void set_content(const std::string &s, const std::string &content_type);
  void set_content(std::string &&s, const std::string &content_type);
  void set_content_provider(
      size_t length, const std::string &content_type, ContentProvider provider,
      ContentProviderResourceReleaser resource_releaser = nullptr);
  void set_content_provider(
      const std::string &content_type, ContentProviderWithoutLength provider,
      ContentProviderResourceReleaser resource_releaser = nullptr);
  void set_chunked_content_provider(
      const std::string &content_type, ContentProviderWithoutLength provider,
      ContentProviderResourceReleaser resource_releaser = nullptr);
  void set_file_content(const std::string &path,
                        const std::string &content_type);
  void set_file_content(const std::string &path);

  Response() = default;
  Response(const Response &) = default;
  Response &operator=(const Response &) = default;
  Response(Response &&) = default;
  Response &operator=(Response &&) = default;
  ~Response() {
    if (content_provider_resource_releaser_) {
      content_provider_resource_releaser_(content_provider_success_);
    }
  }

  // private members...
  size_t content_length_ = 0;
  ContentProvider content_provider_;
  ContentProviderResourceReleaser content_provider_resource_releaser_;
  bool is_chunked_content_provider_ = false;
  bool content_provider_success_ = false;
  std::string file_content_path_;
  std::string file_content_content_type_;
};

class Stream {
public:
  virtual ~Stream() = default;
  virtual bool is_readable() const = 0;
  virtual bool wait_readable() const = 0;
  virtual bool wait_writable() const = 0;
  virtual ssize_t read(char *ptr, size_t size) = 0;
  virtual ssize_t write(const char *ptr, size_t size) = 0;
  virtual void get_remote_ip_and_port(std::string &ip, int &port) const = 0;
  virtual void get_local_ip_and_port(std::string &ip, int &port) const = 0;
  virtual socket_t socket() const = 0;
  virtual time_t duration() const = 0;

  ssize_t write(const char *ptr);
  ssize_t write(const std::string &s);
};

class TaskQueue {
public:
  TaskQueue() = default;
  virtual ~TaskQueue() = default;

  virtual bool enqueue(std::function<void()> fn) = 0;
  virtual void shutdown() = 0;

  virtual void on_idle() {}
};

class ThreadPool final : public TaskQueue {
public:
  explicit ThreadPool(size_t n, size_t mqr = 0)
      : shutdown_(false), max_queued_requests_(mqr) {
    while (n) {
      threads_.emplace_back(worker(*this));
      n--;
    }
  }

  ThreadPool(const ThreadPool &) = delete;
  ~ThreadPool() override = default;

  bool enqueue(std::function<void()> fn) override {
    {
      std::unique_lock<std::mutex> lock(mutex_);
      if (max_queued_requests_ > 0 && jobs_.size() >= max_queued_requests_) {
        return false;
      }
      jobs_.push_back(std::move(fn));
    }

    cond_.notify_one();
    return true;
  }

  void shutdown() override {
    // Stop all worker threads...
    {
      std::unique_lock<std::mutex> lock(mutex_);
      shutdown_ = true;
    }

    cond_.notify_all();

    // Join...
    for (auto &t : threads_) {
      t.join();
    }
  }

private:
  struct worker {
    explicit worker(ThreadPool &pool) : pool_(pool) {}

    void operator()() {
      for (;;) {
        std::function<void()> fn;

        {
          std::unique_lock<std::mutex> lock(pool_.mutex_);

          pool_.cond_.wait(
              lock, [&] { return !pool_.jobs_.empty() || pool_.shutdown_; });

          if (pool_.shutdown_ && pool_.jobs_.empty()) { break; }

          fn = pool_.jobs_.front();
          pool_.jobs_.pop_front();
        }

        assert(true == static_cast<bool>(fn));
        fn();
      }
#if defined(CPPHTTPLIB_OPENSSL_SUPPORT) && !defined(OPENSSL_IS_BORINGSSL) && \
    !defined(LIBRESSL_VERSION_NUMBER)
      OPENSSL_thread_stop();
#endif
    }

    ThreadPool &pool_;
  };

  friend struct worker;

  std::vector<std::thread> threads_;
  std::list<std::function<void()>> jobs_;

  bool shutdown_;
  size_t max_queued_requests_ = 0;

  std::condition_variable cond_;
  std::mutex mutex_;
};

using Logger = std::function<void(const Request &, const Response &)>;

// Forward declaration for Error type
enum class Error;
using ErrorLogger = std::function<void(const Error &, const Request *)>;

using SocketOptions = std::function<void(socket_t sock)>;

namespace detail {

bool set_socket_opt_impl(socket_t sock, int level, int optname,
                         const void *optval, socklen_t optlen);

bool set_socket_opt(socket_t sock, int level, int optname, int opt);

bool set_socket_opt_time(socket_t sock, int level, int optname, time_t sec,
                         time_t usec);

} // namespace detail

void default_socket_options(socket_t sock);

const char *status_message(int status);

std::string get_bearer_token_auth(const Request &req);

namespace detail {

class MatcherBase {
public:
  MatcherBase(std::string pattern) : pattern_(pattern) {}
  virtual ~MatcherBase() = default;
  const std::string &pattern() const { return pattern_; }
  // Match request path and populate its matches and
  virtual bool match(Request &request) const = 0;

private:
  std::string pattern_;
};

/**
 * Captures parameters in request path and stores them in Request::path_params
 *
 * Capture name is a substring of a pattern from : to /.
 * The rest of the pattern is matched against the request path directly
 * Parameters are captured starting from the next character after
 * the end of the last matched static pattern fragment until the next /.
 *
 * Example pattern:
 * "/path/fragments/:capture/more/fragments/:second_capture"
 * Static fragments:
 * "/path/fragments/", "more/fragments/"
 *
 * Given the following request path:
 * "/path/fragments/:1/more/fragments/:2"
 * the resulting capture will be
 * {{"capture", "1"}, {"second_capture", "2"}}
 */
class PathParamsMatcher final : public MatcherBase {
public:
  PathParamsMatcher(const std::string &pattern);
  bool match(Request &request) const override;

private:
  // Treat segment separators as the end of path parameter capture
  // Does not need to handle query parameters as they are parsed before path
  // matching
  static constexpr char separator = '/';
  // Contains static path fragments to match against, excluding the '/' after
  // path params
  std::vector<std::string> static_fragments_;
  // Stores the names of the path parameters to be used as keys in the
  // Request::path_params map
  std::vector<std::string> param_names_;
};

/**
 * Performs std::regex_match on request path
 * and stores the result in Request::matches
 *
 * Note that regex match is performed directly on the whole request.
 * This means that wildcard patterns may match multiple path segments with /:
 * "/begin/(.*)/end" will match both "/begin/middle/end" and "/begin/1/2/end".
 */
class RegexMatcher final : public MatcherBase {
public:
  RegexMatcher(const std::string &pattern)
      : MatcherBase(pattern), regex_(pattern) {}
  bool match(Request &request) const override;

private:
  std::regex regex_;
};

ssize_t write_headers(Stream &strm, const Headers &headers);

} // namespace detail

class Server {
public:
  using Handler = std::function<void(const Request &, Response &)>;
  using ExceptionHandler = 
      std::function<void(const Request &, Response &, std::exception_ptr ep)>;

  enum class HandlerResponse {
    Handled,
    Unhandled,
  };
  using HandlerWithResponse = 
      std::function<HandlerResponse(const Request &, Response &)>;

  using HandlerWithContentReader = std::function<void(
      const Request &, Response &, const ContentReader &content_reader)>;

  using Expect100ContinueHandler = 
      std::function<int(const Request &, Response &)>;

  Server();

  virtual ~Server();

  virtual bool is_valid() const;

  Server &Get(const std::string &pattern, Handler handler);
  Server &Post(const std::string &pattern, Handler handler);
  Server &Post(const std::string &pattern, HandlerWithContentReader handler);
  Server &Put(const std::string &pattern, Handler handler);
  Server &Put(const std::string &pattern, HandlerWithContentReader handler);
  Server &Patch(const std::string &pattern, Handler handler);
  Server &Patch(const std::string &pattern, HandlerWithContentReader handler);
  Server &Delete(const std::string &pattern, Handler handler);
  Server &Delete(const std::string &pattern, HandlerWithContentReader handler);
  Server &Options(const std::string &pattern, Handler handler);

  bool set_base_dir(const std::string &dir, 
                    const std::string &mount_point = std::string());
  bool set_mount_point(const std::string &mount_point, const std::string &dir, 
                       Headers headers = Headers());
  bool remove_mount_point(const std::string &mount_point);
  Server &set_file_extension_and_mimetype_mapping(const std::string &ext, 
                                                  const std::string &mime);
  Server &set_default_file_mimetype(const std::string &mime);

  Server &set_file_request_handler(Handler handler);

  template <class ErrorHandlerFunc>
  Server &set_error_handler(ErrorHandlerFunc &&handler) {
    return set_error_handler_core(
        std::forward<ErrorHandlerFunc>(handler),
        std::is_convertible<ErrorHandlerFunc, HandlerWithResponse>{});
  }

  Server &set_exception_handler(ExceptionHandler handler);
  Server &set_pre_routing_handler(HandlerWithResponse handler);
  Server &set_post_routing_handler(Handler handler);
  Server &set_pre_request_handler(HandlerWithResponse handler);
  Server &set_expect_100_continue_handler(Expect100ContinueHandler handler);

  Server &set_logger(Logger logger);
  Server &set_pre_compression_logger(Logger logger);
  Server &set_error_logger(ErrorLogger error_logger);

  Server &set_address_family(int family);
  Server &set_tcp_nodelay(bool on);
  Server &set_ipv6_v6only(bool on);
  Server &set_socket_options(SocketOptions socket_options);

  Server &set_default_headers(Headers headers);
  Server &
  set_header_writer(std::function<ssize_t(Stream &, Headers &)> const &writer);

  Server &set_keep_alive_max_count(size_t count);
  Server &set_keep_alive_timeout(time_t sec);

  Server &set_read_timeout(time_t sec, time_t usec = 0);
  template <class Rep, class Period>
  Server &set_read_timeout(const std::chrono::duration<Rep, Period> &duration);

  Server &set_write_timeout(time_t sec, time_t usec = 0);
  template <class Rep, class Period>
  Server &set_write_timeout(const std::chrono::duration<Rep, Period> &duration);

  Server &set_idle_interval(time_t sec, time_t usec = 0);
  template <class Rep, class Period>
  Server &
  set_idle_interval(const std::chrono::duration<Rep, Period> &duration);

  Server &set_payload_max_length(size_t length);

  bool bind_to_port(const std::string &host, int port, int socket_flags = 0);
  int bind_to_any_port(const std::string &host, int socket_flags = 0);
  bool listen_after_bind();

  bool listen(const std::string &host, int port, int socket_flags = 0);

  bool is_running() const;
  void wait_until_ready() const;
  void stop();
  void decommission();

  std::function<TaskQueue *(void)> new_task_queue;

protected:
  bool process_request(Stream &strm, const std::string &remote_addr,
                       int remote_port, const std::string &local_addr,
                       int local_port, bool close_connection,
                       bool &connection_closed,
                       const std::function<void(Request &)> &setup_request);

  std::atomic<socket_t> svr_sock_{INVALID_SOCKET};
  size_t keep_alive_max_count_ = CPPHTTPLIB_KEEPALIVE_MAX_COUNT;
  time_t keep_alive_timeout_sec_ = CPPHTTPLIB_KEEPALIVE_TIMEOUT_SECOND;
  time_t read_timeout_sec_ = CPPHTTPLIB_SERVER_READ_TIMEOUT_SECOND;
  time_t read_timeout_usec_ = CPPHTTPLIB_SERVER_READ_TIMEOUT_USECOND;
  time_t write_timeout_sec_ = CPPHTTPLIB_SERVER_WRITE_TIMEOUT_SECOND;
  time_t write_timeout_usec_ = CPPHTTPLIB_SERVER_WRITE_TIMEOUT_USECOND;
  time_t idle_interval_sec_ = CPPHTTPLIB_IDLE_INTERVAL_SECOND;
  time_t idle_interval_usec_ = CPPHTTPLIB_IDLE_INTERVAL_USECOND;
  size_t payload_max_length_ = CPPHTTPLIB_PAYLOAD_MAX_LENGTH;

private:
  using Handlers = 
      std::vector<std::pair<std::unique_ptr<detail::MatcherBase>, Handler>>;
  using HandlersForContentReader = 
      std::vector<std::pair<std::unique_ptr<detail::MatcherBase>,
                            HandlerWithContentReader>>;

  static std::unique_ptr<detail::MatcherBase>
  make_matcher(const std::string &pattern);

  Server &set_error_handler_core(HandlerWithResponse handler, std::true_type);
  Server &set_error_handler_core(Handler handler, std::false_type);

  socket_t create_server_socket(const std::string &host, int port,
                                int socket_flags,
                                SocketOptions socket_options) const;
  int bind_internal(const std::string &host, int port, int socket_flags);
  bool listen_internal();

  bool routing(Request &req, Response &res, Stream &strm);
  bool handle_file_request(const Request &req, Response &res);
  bool dispatch_request(Request &req, Response &res,
                        const Handlers &handlers) const;
  bool dispatch_request_for_content_reader(
      Request &req, Response &res,
      ContentReader content_reader,
      const HandlersForContentReader &handlers) const;

  bool parse_request_line(const char *s, Request &req) const;
  void apply_ranges(const Request &req, Response &res,
                    std::string &content_type, std::string &boundary) const;
  bool write_response(Stream &strm, bool close_connection, Request &req,
                      Response &res);
  bool write_response_with_content(Stream &strm, bool close_connection,
                                   const Request &req, Response &res);
  bool write_response_core(Stream &strm, bool close_connection,
                           const Request &req, Response &res,
                           bool need_apply_ranges);
  bool write_content_with_provider(Stream &strm, const Request &req,
                                   Response &res, const std::string &boundary,
                                   const std::string &content_type);
  bool read_content(Stream &strm, Request &req, Response &res);
  bool read_content_with_content_receiver(
      Stream &strm, Request &req, Response &res, ContentReceiver receiver,
      FormDataHeader multipart_header, ContentReceiver multipart_receiver);
  bool read_content_core(Stream &strm, Request &req, Response &res,
                         ContentReceiver receiver,
                         FormDataHeader multipart_header,
                         ContentReceiver multipart_receiver) const;

  virtual bool process_and_close_socket(socket_t sock);

  void output_log(const Request &req, const Response &res) const;
  void output_pre_compression_log(const Request &req,
                                  const Response &res) const;
  void output_error_log(const Error &err, const Request *req) const;

  std::atomic<bool> is_running_{false};
  std::atomic<bool> is_decommissioned{false};

  struct MountPointEntry {
    std::string mount_point;
    std::string base_dir;
    Headers headers;
  };
  std::vector<MountPointEntry> base_dirs_;
  std::map<std::string, std::string> file_extension_and_mimetype_map_;
  std::string default_file_mimetype_ = "application/octet-stream";
  Handler file_request_handler_;
  Handlers get_handlers_;
  Handlers post_handlers_;
  HandlersForContentReader post_handlers_for_content_reader_;
  Handlers put_handlers_;
  HandlersForContentReader put_handlers_for_content_reader_;
  Handlers patch_handlers_;
  HandlersForContentReader patch_handlers_for_content_reader_;
  Handlers delete_handlers_;
  HandlersForContentReader delete_handlers_for_content_reader_;
  Handlers options_handlers_;
  HandlerWithResponse error_handler_;
  ExceptionHandler exception_handler_;
  HandlerWithResponse pre_routing_handler_;
  Handler post_routing_handler_;
  HandlerWithResponse pre_request_handler_;
  Expect100ContinueHandler expect_100_continue_handler_;
  mutable std::mutex logger_mutex_;
  Logger logger_;
  Logger pre_compression_logger_;
  ErrorLogger error_logger_;

  int address_family_ = AF_UNSPEC;
  bool tcp_nodelay_ = CPPHTTPLIB_TCP_NODELAY;
  bool ipv6_v6only_ = CPPHTTPLIB_IPV6_V6ONLY;
  SocketOptions socket_options_ = default_socket_options;
  Headers default_headers_;
  std::function<ssize_t(Stream &, Headers &)> header_writer_ = 
      detail::write_headers;
};

#endif // CPPHTTPLIB_HTTPLIB_H
