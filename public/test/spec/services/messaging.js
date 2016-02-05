'use strict';

describe('Service: Messaging', function () {

  // load the service's module
  beforeEach(module('publicApp'));

  // instantiate service
  var Messaging;
  beforeEach(inject(function (_Messaging_) {
    Messaging = _Messaging_;
  }));

  it('should do something', function () {
    expect(!!Messaging).toBe(true);
  });

});
