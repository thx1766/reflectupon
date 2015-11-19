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
      end: 20
    }, {
      start: 16,
      end: 32
    }];

    var actual = mixin.condenseArray(inputs);
    expect(actual.length).toBe(1);
    expect(actual[0].start).toBe(4);
    expect(actual[0].end).toBe(32);
  });

  it ("second annotation should wrap around first annotation", function() {
    var inputs = [{
      start: 4,
      end: 20
    }, {
      start: 2,
      end: 22
    }];

    var actual = mixin.condenseArray(inputs);
    expect(actual.length).toBe(1);
    expect(actual[0].start).toBe(2);
    expect(actual[0].end).toBe(22);
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
      start: 4
    }, {
      end: 175,
      start: 80
    }, {
      end: 262,
      start: 184
    }];

    var actual = mixin.condenseArray(inputs);
    expect(actual.length).toBe(2);
    expect(actual[0].end).toBe(175);
    expect(actual[1].end).toBe(262);
  });

  it ("should start with first annotation, then merge second and third annotations", function() {
    var inputs = [{
      end: 83,
      start: 4
    }, {
      end: 175,
      start: 100
    }, {
      end: 262,
      start: 160
    }];

    var actual = mixin.condenseArray(inputs);
    expect(actual.length).toBe(2);
    expect(actual[0].start).toBe(4);
    expect(actual[0].end).toBe(83);
    expect(actual[1].start).toBe(100);
    expect(actual[1].end).toBe(262);
  });


  it ("should start with first annotation, and ignore second annotation", function() {
    var inputs = [{
      end: 83,
      start: 4
    }, {
      end: 83,
      start: 10
    }];

    var actual = mixin.condenseArray(inputs);
    expect(actual.length).toBe(1);
    expect(actual[0].start).toBe(4);
    expect(actual[0].end).toBe(83);
  });

  it ("should make three separate annotations, then a merged fourth", function() {
    var inputs = [{
      end: 83,
      start: 4
    }, {
      end: 175,
      start: 93
    }, {
      end: 262,
      start: 184
    }, {
      start: 90,
      end: 170
    }];

    var actual = mixin.condenseArray(inputs);
    expect(actual[0].end).toBe(83);
    expect(actual[1].start).toBe(90);
    expect(actual[2].end).toBe(262);
  });

  it ("should make three separate annotations, then merged the fourth with first two", function() {
    var inputs = [{
      end: 83,
      start: 4
    }, {
      end: 175,
      start: 93
    }, {
      end: 262,
      start: 184
    }, {
      start: 80,
      end: 180
    }];

    var actual = mixin.condenseArray(inputs);
    expect(actual.length).toBe(2);
    expect(actual[0].end).toBe(180);
    expect(actual[1].end).toBe(262);
  });

});