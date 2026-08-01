let json = '{ "age": 30 }';

try {

  let user = JSON.parse(json);

  if (!user.name) {
    throw new SyntaxError("Incomplete");
  }

  alert( user.name );

} catch (err) {

  if (err instanceof SyntaxError) {
    alert( "JSON Error:"+ err.message);
  } else {
    throw err; // rethrow errors
  }
}
