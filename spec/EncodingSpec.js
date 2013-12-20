describe("Kademlia.Encoding", function() {

  var encoder = new Kademlia.Bencode();
  
  var testCases = [
  
    [42, 'i42e'], ['spam', '4:spam'], [['spam', 42], 'l4:spami42ee'],
    [{ foo: 42, bar: 'spam'}, 'd3:bar4:spam3:fooi42ee'],
    [[ ['abc', '127.0.0.1', 1919], ['def', '127.0.0.1', 1921] ],
    'll3:abc9:127.0.0.1i1919eel3:def9:127.0.0.1i1921eee']
    
  ];
    
  it ("should encode objects using Bencode", function () {

    _.each(testCases, function (testCase) {
      expect(encoder.encode(testCase[0])).toEqual(testCase[1]);
    });
    
  });
  
  
  it ("should decode objects using Bencode", function () {

    _.each(testCases, function (testCase) {
      expect(encoder.decode(testCase[1])).toEqual(testCase[0]);
    });
    
  });
  
});