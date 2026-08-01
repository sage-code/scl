let json = "{ bad json }";

try {
  let user = JSON.parse(json);
  alert( user.name );
} catch (err) {
  alert( err.name );
  alert( err.message );
}
