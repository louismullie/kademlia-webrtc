var Random = {

  uuid: function (entropy) {
    return this.randHex(entropy || 4);
  },
  
  randBytes: function (words) {
    return sjcl.random.randomWords(words);
  },
  
  randHex: function (bytes) {
    Hash.sha1(this.randBytes(bytes));
  }
  
};