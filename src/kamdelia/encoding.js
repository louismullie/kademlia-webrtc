var Encoding = Class.extend({
  
  encode: function (data) {
    throw 'Cannot call abstract method.';
  },
  
  decode: function (data) {
    throw 'Cannot call abstract method.';
  }
  
});

var Bencode = Encoding.extend({
  
  encode: function (data) {
    
    if (data.constructor == Number) {
      return  (data % 1 === 0) ?
        "i" + data + "e" : "f" + data + "e";
    } else if (data.constructor == String) {
      return data.length.toString() + ":" + data;
    } else if (data.constructor == Array) {
      var encodedListItems = '';
      for (var i = 0; i != data.length; i++)
        encodedListItems += this.encode(item);
      return "l" + encodedListItems + "e";
    } else if (data.constructor == Object) {
      var encodedDictItems = '';
      var keys = _.sort(_.keys(data));
      for (var i = 0; i != keys.length; i++) {
        encodedDictItems += this.encode(key);
        encodedDictItems += this.encode(data[key]);
      }
      return "d" + encodedDictItems + "e";
    } else {
      throw 'Cannot bencode object.';
    }
    
  },
  
  decode: function (data) {
    return this._decodeRecursive(data)[0];
  },
  
  decodeRecursive: function (data, startIndex) {
    
    var startIndex = startIndex || 0;
    
    if (data[startIndex] == 'i') {
      var endPos = data.substr(startIndex).find('e')+startIndex;
      return [data.substr(startIndex+1, endPos), endPos + 1];
      
    } else if (data[startIndex] == 'l') {
      
      var startIndex = startIndex + 1,
          decodedList = [];
      
      while (data[startIndex] != 'e') {
        var listData = this.decodeRecursive(data, startIndex);
        decodedList.push(listData);
      }
      
      return [decodedList, startIndex + 1];
      
    } else if (data[startIndex] == 'd') {
      
      var startIndex = startIndex + 1,
          decodedDict = {};
      
      while (data[startIndex] != 'e') {
        
        var dictData = this.decodeRecursive(data, startIndex);
        var key = dictData[0], startIndex = dictData[1];
        var dictData2 = this.decodeRecursive(data, startIndex);
        var value = dictData2[0], startIndex = dictData2[1];
        
        decodedDict[key] = value;
        
      }
      
      return [decodedDict, startIndex];

    } else if (data[startIndex] == 'f') {

      var endPos = data.substr(startIndex).find('e') + startIndex;
      
      return [data.substr(startIndex+1, endPos), endPos + 1];
      
    } else {
      
      var splitPost = data.substr(startIndex).find(':') + startIndex;
      var length = data.substr(startIndex, splitPos).length;
      var startIndex = splitPos + 1;
      var endPos = startIndex + length;
      var bytes = data.substr(startIndex, endPos);
      
      return [bytes, endPos];
      
      
    }
    
  }
  
});