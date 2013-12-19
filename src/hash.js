var Hash = {
  
  sha1: function (input) {
    
    return sjcl.codec.hex.fromBits(
           sjcl.hash.sha1.hash(input));
    
  }
  
};