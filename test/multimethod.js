'use strict';
/*globals describe, it, before, match, eq*/
var method = match.method,
    guard = match.guard,
    pred = match.predicates,
    instanceOf = pred.instanceOf,
    prototypeOf = pred.prototypeOf,
    isA = pred.isA,
    _ = match._,
    create = Object.create || function(o){
      function F(){}
      F.prototype = o;
      return new F();
    };

function rockRock(a1, a2){
  return 'Asteroids collide!'+a1.crash() + a2.crash();
}

function shipShip(s1, s2){
  return 'Call the gecko...'+s1.crash()+s2.crash();
}

function rockShip(a, s){
  return 'Space debris'+a.crash()+s.crash();
}

function shipRock(s, a){
  return 'Whoops'+a.crash()+s.crash();
}

function testCrash(crash, rock, ship){
  eq(crash(rock(1), rock(2)), 'Asteroids collide! Boom! 1 Boom! 2');
  eq(crash(ship(1), ship(2)), 'Call the gecko... Bang! 1 Bang! 2');
  eq(crash(rock(3), ship(3)), 'Space debris Boom! 3 Bang! 3');
  eq(crash(ship(4), rock(4)), 'Whoops Boom! 4 Bang! 4');
}

describe('Asteroid/Spaceship instanceOf', function(){
  var Asteroid = function(id){
    this.id = id;
  };
  Asteroid.prototype.crash = function(){
    return " Boom! "+this.id;
  };

  var Spaceship = function(id){
    this.id = id;
  };
  Spaceship.prototype.crash = function(){
    return " Bang! "+this.id;
  };

  function rock(id){
    return new Asteroid(id);
  }

  function ship(id){
    return new Spaceship(id);
  }

  it('should overload crash guard method', function(){
    var crash = match(
        method(Asteroid, Asteroid)(rockRock),
        method(Spaceship, Spaceship)(shipShip),
        method(Asteroid, Spaceship)(rockShip),
        method(Spaceship, Asteroid)(shipRock));
    testCrash(crash, rock, ship);
  });

  it('should overload crash guard isA', function(){
    var crash = match(
        guard(isA(Asteroid), isA(Asteroid))(rockRock),
        guard(isA(Spaceship), isA(Spaceship))(shipShip),
        guard(isA(Asteroid), isA(Spaceship))(rockShip),
        guard(isA(Spaceship), isA(Asteroid))(shipRock));
    testCrash(crash, rock, ship);
  });

  it('should overload crash guard instanceOf', function(){
    var crash = match(
        guard(instanceOf(Asteroid), instanceOf(Asteroid))(rockRock),
        guard(instanceOf(Spaceship), instanceOf(Spaceship))(shipShip),
        guard(instanceOf(Asteroid), instanceOf(Spaceship))(rockShip),
        guard(instanceOf(Spaceship), instanceOf(Asteroid))(shipRock));
    testCrash(crash, rock, ship);
  });

});

describe('Asteroid/Spaceship prototypeOf', function(){
  var Asteroid = {
    crash: function(){
      return " Boom! "+this.id;
    }
  };

  var Spaceship = {
    crash: function(){
      return " Bang! "+this.id;
    }
  };

  function rock(id){
    var obj = create(Asteroid);
    obj.id = id;
    return obj;
  }

  function ship(id){
    var obj = create(Spaceship);
    obj.id = id;
    return obj;
  }

  it('should overload crash guard method', function(){
    var crash = match(
        method(Asteroid, Asteroid)(rockRock),
        method(Spaceship, Spaceship)(shipShip),
        method(Asteroid, Spaceship)(rockShip),
        method(Spaceship, Asteroid)(shipRock));
    testCrash(crash, rock, ship);
  });

  it('should overload crash guard isA', function(){
    var crash = match(
        guard(isA(Asteroid), isA(Asteroid))(rockRock),
        guard(isA(Spaceship), isA(Spaceship))(shipShip),
        guard(isA(Asteroid), isA(Spaceship))(rockShip),
        guard(isA(Spaceship), isA(Asteroid))(shipRock));
    testCrash(crash, rock, ship);
  });

  it('should overload crash guard prototypeOf', function(){
    var crash = match(
        guard(prototypeOf(Asteroid), prototypeOf(Asteroid))(rockRock),
        guard(prototypeOf(Spaceship), prototypeOf(Spaceship))(shipShip),
        guard(prototypeOf(Asteroid), prototypeOf(Spaceship))(rockShip),
        guard(prototypeOf(Spaceship), prototypeOf(Asteroid))(shipRock));
    testCrash(crash, rock, ship);
  });
});
