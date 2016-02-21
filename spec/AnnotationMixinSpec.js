describe("AnnotationMixin", function() {
  var mixin = window.rupon.mixins.AnnotationMixin;
  it ("should move second annotation after first annotation", function() {
    var inputs = [{
      end: 83,
      start: 4,
      text: "m ipsum dolor sit amet, consectetur adipiscing elit. Duis finibus, sem nec vehi"
    },{
      end: 175,
      start: 93,
      text: "od, lorem lectus pellentesque ante, vel volutpat nulla nisi vel orci. Nunc iaculis"
    }];

    var actual = mixin.condenseArray(inputs);
    expect(actual[0].end).toBe(83);
    expect(actual[1].end).toBe(175);
  });

  it ("second annotation should come before first annotation", function() {
    var inputs = [{
      end: 175,
      start: 93,
      text: "od, lorem lectus pellentesque ante, vel volutpat nulla nisi vel orci. Nunc iaculis"
    },{
      end: 83,
      start: 4,
      text: "m ipsum dolor sit amet, consectetur adipiscing elit. Duis finibus, sem nec vehi"
    }];

    var actual = mixin.condenseArray(inputs);
    expect(actual[0].end).toBe(83);
    expect(actual[1].end).toBe(175);
  });

  it ("second annotation should extend first annotation", function() {
    var inputs = [{
      start: 4,
      end: 20,
      reply_id: ['123']
    }, {
      start: 16,
      end: 32,
      reply_id: ['234']
    }];

    var actual = mixin.condenseArray(inputs);
    expect(actual.length).toBe(1);
    expect(actual[0].start).toBe(4);
    expect(actual[0].end).toBe(32);
    expect(actual[0].reply_id[0]).toBe('123');
    expect(actual[0].reply_id[1]).toBe('234');
  });

  it ("second annotation should wrap around first annotation", function() {
    var inputs = [{
      start: 4,
      end: 20,
      reply_id: ['456']
    }, {
      start: 2,
      end: 22,
      reply_id: ['567']
    }];

    var actual = mixin.condenseArray(inputs);
    expect(actual.length).toBe(1);
    expect(actual[0].start).toBe(2);
    expect(actual[0].end).toBe(22);
    expect(actual[0].reply_id[0]).toBe('567');
    expect(actual[0].reply_id[1]).toBe('456');
  });

  it ("second annotation should start before first annotation, but end at the same time", function() {
    var inputs = [{
      start: 4,
      end: 20,
      reply_id: ['456']
    }, {
      start: 2,
      end: 20,
      reply_id: ['567']
    }];

    var actual = mixin.condenseArray(inputs);
    expect(actual.length).toBe(1);
    expect(actual[0].start).toBe(2);
    expect(actual[0].reply_id[0]).toBe('567');
    expect(actual[0].reply_id[1]).toBe('456');
  });

  it ("should move third annotation past the first two annotations", function() {
    var inputs = [{
      end: 83,
      start: 4,
      text: "m ipsum dolor sit amet, consectetur adipiscing elit. Duis finibus, sem nec vehi"
    }, {
      end: 175,
      start: 93,
      text: "od, lorem lectus pellentesque ante, vel volutpat nulla nisi vel orci. Nunc iaculis"
    }, {
      end: 262,
      start: 184,
      text: "uis varius semper, felis massa feugiat massa, ut tincidunt magna dolor a magna"
    }];

    var actual = mixin.condenseArray(inputs);
    expect(actual[0].end).toBe(83);
    expect(actual[1].end).toBe(175);
    expect(actual[2].end).toBe(262);
  });

  it ("should move merge first two annotations, then add third annotation", function() {
    var inputs = [{
      end: 83,
      start: 4,
      reply_id: ['257']
    }, {
      end: 175,
      start: 80,
      reply_id: ['573']
    }, {
      end: 262,
      start: 184,
      reply_id: ['298']
    }];

    var actual = mixin.condenseArray(inputs);
    expect(actual.length).toBe(2);
    expect(actual[0].end).toBe(175);
    expect(actual[0].reply_id[0]).toBe('257');
    expect(actual[1].end).toBe(262);
    expect(actual[1].reply_id[0]).toBe('298');
  });

  it ("should start with first annotation, then merge second and third annotations", function() {
    var inputs = [{
      end: 83,
      start: 4,
      reply_id: ['262']
    }, {
      end: 175,
      start: 100,
      reply_id: ['622']
    }, {
      end: 262,
      start: 160,
      reply_id: ['162']
    }];

    var actual = mixin.condenseArray(inputs);
    expect(actual.length).toBe(2);
    expect(actual[0].start).toBe(4);
    expect(actual[0].end).toBe(83);
    expect(actual[0].reply_id[0]).toBe('262');
    expect(actual[1].start).toBe(100);
    expect(actual[1].end).toBe(262);
    expect(actual[1].reply_id[0]).toBe('622');
  });


  it ("should start with first annotation, and ignore second annotation's start", function() {
    var inputs = [{
      end: 83,
      start: 4,
      reply_id: ['123']
    }, {
      end: 83,
      start: 10,
      reply_id: ['234']
    }];

    var actual = mixin.condenseArray(inputs);
    expect(actual.length).toBe(1);
    expect(actual[0].start).toBe(4);
    expect(actual[0].end).toBe(83);
    expect(actual[0].reply_id[0]).toBe('123');
    expect(actual[0].reply_id[1]).toBe('234');
  });

  it ("should make three separate annotations, then a merged fourth", function() {
    var inputs = [{
      end: 83,
      start: 4,
      reply_id: ['123']
    }, {
      end: 175,
      start: 93,
      reply_id: ['234']
    }, {
      end: 262,
      start: 184,
      reply_id: ['345']
    }, {
      start: 90,
      end: 170,
      reply_id: ['456']
    }];

    var actual = mixin.condenseArray(inputs);
    expect(actual[0].end).toBe(83);
    expect(actual[1].start).toBe(90);
    expect(actual[1].reply_id[0]).toBe('456');
    expect(actual[1].reply_id[1]).toBe('234');
    expect(actual[2].end).toBe(262);
  });

  it ("should make three separate annotations, then merged the fourth with first two", function() {
    var inputs = [{
      end: 83,
      start: 4,
      reply_id: ['123']
    }, {
      end: 175,
      start: 93,
      reply_id: ['234']
    }, {
      end: 262,
      start: 184,
      reply_id: ['345']
    }, {
      start: 80,
      end: 180,
      reply_id: ['456']
    }];

    var actual = mixin.condenseArray(inputs);
    expect(actual.length).toBe(2);
    expect(actual[0].end).toBe(180);
    expect(actual[0].reply_id[0]).toBe('123');
    expect(actual[0].reply_id[1]).toBe('456');
    expect(actual[0].reply_id[2]).toBe('234');
    expect(actual[1].end).toBe(262);
  });

});