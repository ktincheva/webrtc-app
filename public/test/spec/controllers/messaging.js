'use strict';

describe('Controller: MessagingCtrl', function () {

  // load the controller's module
  beforeEach(module('publicApp'));

  var MessagingCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    MessagingCtrl = $controller('MessagingCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(MessagingCtrl.awesomeThings.length).toBe(3);
  });
});
