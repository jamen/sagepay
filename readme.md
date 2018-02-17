
# sagepay

A Node.js package for [Sage Pay][1]'s [server integration protocol][2].

## Install

```sh
npm i sagepay
```

## Usage

The docs rely heavily on ["Sage Pay Server Integration and Protocol Guidelines
3.00"][3], specifically pages 44+ (Character Sets and Encoding, Transaction
Registration, Notification of Transaction Results, URLs).

Refer to these guidelines to build better understanding on registering,
verifying, and testing payments from Node.js.

**Note:** All option and return properties match the casing of the guidelines.

### `sagepay.registerTransaction(options)`

Registers payment with Sage Pay.  Uses `NotificationURL` option to send a request
back to your server (where you use `sagepay.finishTransaction`).  See [the
guidelines][3] for more required options.

Additional options:

- `testing` switches to Sage Pay's test server.  Defaults to `false`

Returns a promise containing the response data.  Use `NextURL` to
redirect your client to Sage Pay's transaction portal.

```js
sagepay.registerPayment({
  Vendor: 'your vendor name',
  NotificationURL: 'your notification endpoint',
  TxType: 'payment',
  // ...
}).then(result => {
  console.log(result.Status)
  console.log(result.NextURL)
}, err => {
  console.error(err)
})
```

### `sagepay.transactionResults(request)`

Takes a [`http.Server` request][4] that comes from Sage Pay's server (after
registering the transaction) and returns a promise of the results.  Use
`sagepay.finishTransaction` after.

```js
sagepay.transactionResults(request).then(data => {
  console.log(data.Status)
  console.log(data.VendorTxCode)
  // ...
}, err => {
  console.error(err)
})
```

### `sagepay.finishTransaction(response, options)`

Writes [a `http.Server` response][5] to Sage Pay finishing the transaction.
Uses `RedirectURL` option to send the user from the transaction portal back to
your website. See [the guidelines][3] for more options.

Returns a promise and resolves when successful.

```js
sagepay.finishTransaction(request, response, {
  Status: 'OK',
  RedirectURL: 'your finish page',
  // ...
}).then(resp => {
  console.log('Finished transaction')
}, err => {
  console.error(err)
})
```

### `sagepay.testCards`

A list of different test cards in the format:

```json
{
  "method": "Visa",
  "number": "4929 0000 0000 6",
  "cardtype": "VISA",
  "3dsecure": "Y"
}
```

See [the guidelines][3] for more details

### `sagepay.fields`

List of all request and response fields with proper casing.

## License

[MIT](license) &copy; Jamen Marz

[1]: https://www.sagepay.co.uk/
[2]: https://www.sagepay.co.uk/support/find-an-integration-document/server-integration-documents
[3]: https://www.sagepay.co.uk/file/25046/download-document/SERVER_Integration_and_Protocol_Guidelines_270815.pdf?token=0vicY97ySO6ig8HB1AKWj_6_RO4FSG9gChHL9ftI0Ow
[4]: https://nodejs.org/api/http.html#http_class_http_incomingmessage
[5]: https://nodejs.org/api/http.html#http_class_http_serverresponse
