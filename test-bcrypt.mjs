import bcrypt from 'bcryptjs';

const password1 = 'b;?eJiOv]~^H<V-$lXR3aU)5)SGO?#6%/7BT$N';
const password2 = '123456';

const hash1 = '$2b$10$lPMUZoqg1Y.M/63aBGuYxeplua3Vad1/RAUffV8H9OlmFwhluNMmK';
const hash2 = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

console.log('Test 1 - Complex password:');
const result1 = await bcrypt.compare(password1, hash1);
console.log('Result:', result1);

console.log('\nTest 2 - Simple password 123456:');
const result2 = await bcrypt.compare(password2, hash2);
console.log('Result:', result2);

console.log('\nGenerating new hash for 123456:');
const newHash = await bcrypt.hash('123456', 10);
console.log('New hash:', newHash);
const verify = await bcrypt.compare('123456', newHash);
console.log('Verify:', verify);
