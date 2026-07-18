document.write("<br>")
a = 3, b = "4"; // fixture
document.write('a, b = ', a, ',', b, '<br>');
/* implicit coercion */
document.write('a + b =', a + b,'<br>' );
document.write('b - a =', b - a,'<br>' );
/* explicit coercion */
c = a + Number(b); // 7
document.write('c = ',c);