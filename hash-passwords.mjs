import bcrypt from 'bcryptjs';

const password1 = 'b;?eJiOv]~^H<V-$lXR3aU)5)SGO?#6%/7BT$N';
const password2 = '#yOR{1Ue-4Bp764S~Mo2]Q}6oE|I8d*D]"$<(X';

const hash1 = await bcrypt.hash(password1, 10);
const hash2 = await bcrypt.hash(password2, 10);

console.log('DELETE FROM admins;');
console.log('');
console.log('INSERT INTO admins (username, password, createdAt) VALUES');
console.log("('SEF1', '" + hash1 + "', NOW()),");
console.log("('SEF2', '" + hash2 + "', NOW());");
