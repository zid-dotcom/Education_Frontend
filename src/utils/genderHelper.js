/**
 * Detects whether a student name corresponds to a boy or girl.
 * Supports explicit gender override and extensive multilingual (Indian, Western, Islamic, Global) names & suffixes.
 */

const FEMALE_NAMES = new Set([
  // Popular Indian female names
  'aanya', 'aarti', 'aditi', 'aishwarya', 'akanksha', 'alka', 'amita', 'amrita', 'ananya', 'anita',
  'ankita', 'anshika', 'anushka', 'aparna', 'archana', 'arpita', 'aruna', 'asha', 'ashwini', 'avani',
  'bhavna', 'bindiya', 'chahat', 'charu', 'deepa', 'deepika', 'deepti', 'diya', 'divya', 'drishti',
  'ekta', 'garima', 'gayatri', 'geeta', 'gita', 'hema', 'ishita', 'jaya', 'jyoti', 'kajal', 'kalpana',
  'kamla', 'kalyani', 'kiran', 'komal', 'kriti', 'lata', 'laxmi', 'leela', 'madhu', 'malini', 'mamta',
  'manju', 'meena', 'meenakshi', 'meera', 'megha', 'mona', 'monika', 'mukta', 'naina', 'namrata',
  'neelam', 'neha', 'nisha', 'nita', 'niti', 'pallavi', 'parvati', 'pooja', 'poonam', 'prachi',
  'pratibha', 'prerna', 'priya', 'priyanka', 'radha', 'radhika', 'ragini', 'rajni', 'rakhi', 'rashmi',
  'reena', 'renu', 'riya', 'ritu', 'roopa', 'ruchi', 'sakshi', 'sangeeta', 'sanjana', 'sapna',
  'sarita', 'seema', 'shalini', 'shashi', 'sheetal', 'shilpa', 'shivani', 'shobha', 'shraddha',
  'shreya', 'shruti', 'simran', 'smita', 'sneha', 'sonal', 'sonali', 'sonia', 'srishti', 'suman',
  'sunita', 'sushma', 'swati', 'tanvi', 'tara', 'trisha', 'uma', 'urmila', 'urvashi', 'vaishali',
  'vandana', 'vani', 'varsha', 'vidya', 'vinita', 'yamini', 'yashoda', 'zara', 'zoya', 'anjali',
  'ammu', 'ann', 'anne', 'annie', 'mercy', 'sharon', 'nimmy', 'reshma', 'athira', 'arya', 'gopika',
  'veena', 'aswathy', 'dhanya', 'remya', 'soumya', 'chithra', 'vidhya', 'sruthi', 'surabhi', 'deepthi',
  'bindu', 'beena', 'leena', 'kavya', 'keerthi', 'kavitha', 'anitha', 'sunitha', 'geetha',

  // Western & International female names
  'mary', 'sarah', 'sara', 'emma', 'olivia', 'ava', 'isabella', 'sophia', 'mia', 'charlotte',
  'amelia', 'harper', 'evelyn', 'abigail', 'emily', 'elizabeth', 'mila', 'ella', 'avery', 'sofia',
  'camila', 'aria', 'scarlett', 'victoria', 'madison', 'luna', 'grace', 'chloe', 'penelope', 'layla',
  'riley', 'zoey', 'nora', 'lily', 'eleanor', 'hannah', 'lillian', 'addison', 'aubrey', 'ellie',
  'stella', 'natalie', 'zoe', 'leah', 'hazel', 'violet', 'aurora', 'savannah', 'audrey', 'brooklyn',
  'bella', 'claire', 'skylar', 'lucy', 'paisley', 'anna', 'caroline', 'nova', 'genesis', 'aaliyah',
  'kennedy', 'samantha', 'maya', 'willow', 'kinsley', 'naomi', 'elena', 'eliana', 'allison',
  'gabriella', 'alice', 'madelyn', 'cora', 'ruby', 'eva', 'seraphina', 'jessica', 'ashley', 'amanda',
  'brittany', 'megan', 'rachel', 'lauren', 'stephanie', 'nicole', 'jennifer', 'chelsea', 'kayla',
  'amber', 'danielle', 'courtney', 'rebecca', 'melissa', 'michelle', 'tiffany', 'vanessa', 'julie',

  // Islamic / Arabic female names
  'fatima', 'ayesha', 'khadija', 'mariam', 'zainab', 'noor', 'sana', 'hiba', 'bushra', 'amira',
  'yasmin', 'farah', 'samira', 'asma', 'reem', 'hafsa', 'sumayya', 'safia', 'ruqayya', 'salma',
]);

const MALE_NAMES = new Set([
  // Popular English / Western & John variations
  'john', 'johnn', 'johnny', 'jonathan', 'jon', 'jack', 'james', 'robert', 'michael', 'william',
  'david', 'richard', 'joseph', 'thomas', 'charles', 'christopher', 'daniel', 'matthew', 'anthony',
  'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua', 'kenneth', 'kevin', 'brian', 'george',
  'edward', 'ronald', 'timothy', 'jason', 'jeffrey', 'ryan', 'jacob', 'gary', 'nicholas', 'eric',
  'stephen', 'larry', 'justin', 'scott', 'brandon', 'frank', 'benjamin', 'gregory', 'samuel',
  'raymond', 'patrick', 'alexander', 'dennis', 'jerry', 'tyler', 'aaron', 'jose', 'adam', 'nathan',
  'henry', 'douglas', 'zachary', 'peter', 'kyle', 'walter', 'ethan', 'jeremy', 'harold', 'keith',
  'christian', 'roger', 'noah', 'gerald', 'carl', 'terry', 'sean', 'austin', 'arthur', 'lawrence',
  'jesse', 'dylan', 'bryan', 'joe', 'jordan', 'billy', 'albert', 'bruce', 'gabriel', 'logan',
  'alan', 'juan', 'wayne', 'roy', 'ralph', 'randy', 'eugene', 'vincent', 'russell', 'louis',
  'philip', 'bobby', 'bradley', 'alex', 'bob', 'charlie', 'sam', 'tom', 'max', 'leo', 'ben',
  'dan', 'luke', 'liam', 'lucas', 'mason', 'oliver', 'elijah', 'jameson', 'ezra', 'asher',
  'mateo', 'theodore', 'hudson', 'colton', 'sebastian', 'mathew', 'varghese', 'georgy', 'alen',

  // Indian male names
  'rahul', 'rohan', 'amit', 'amits', 'ajith', 'aravind', 'renjith', 'hanu', 'anand', 'anil',
  'ankit', 'arun', 'ashish', 'deepak', 'dinesh', 'gaurav', 'harsh', 'karan', 'manish', 'manoj',
  'mukesh', 'nikhil', 'pankaj', 'prashant', 'praveen', 'raj', 'rajesh', 'rakesh', 'ramesh',
  'ravi', 'rishabh', 'sachin', 'sandeep', 'sanjay', 'saurabh', 'shiv', 'sumit', 'suresh', 'tarun',
  'varun', 'vikas', 'vinay', 'vivek', 'abhishek', 'aditya', 'ajay', 'akash', 'alok', 'aman',
  'amar', 'amrit', 'anuj', 'aryan', 'ashok', 'ayush', 'bharat', 'bhavin', 'bhavesh', 'chetan',
  'chirag', 'darshan', 'dev', 'dhruv', 'dilip', 'girish', 'hardik', 'harish', 'harshit', 'hemant',
  'hitesh', 'ishan', 'jagdish', 'jay', 'jayesh', 'jitendra', 'kamal', 'kapil', 'kartik', 'keshav',
  'kunal', 'lalit', 'lokesh', 'madhav', 'mahesh', 'manthan', 'mayank', 'meet', 'mohit', 'naresh',
  'naveen', 'navin', 'neeraj', 'nilesh', 'nitin', 'om', 'parth', 'piyush', 'pradeep', 'prakash',
  'pranay', 'prateek', 'pratik', 'prem', 'puneet', 'raghav', 'rajat', 'rajiv', 'rajeev', 'rakshit',
  'ram', 'raman', 'ranveer', 'rohit', 'ronak', 'sahil', 'samarth', 'sameer', 'samir', 'sanket',
  'sarvesh', 'satish', 'shantanu', 'shashank', 'shivam', 'shreyas', 'shubham', 'siddharth', 'sid',
  'soham', 'sourabh', 'sudhir', 'sunil', 'swapnil', 'tanmay', 'tejas', 'tushar', 'umesh', 'utkarsh',
  'vaibhav', 'vedant', 'vibhor', 'vidit', 'vijay', 'vikram', 'vimal', 'vipul', 'virendra', 'vishal',
  'yash', 'yuvraj',

  // Islamic / Arabic male names
  'mohammad', 'mohammed', 'muhammed', 'ahmed', 'ali', 'hassan', 'hussain', 'omar', 'usman',
  'bilal', 'zayd', 'hamza', 'mustafa', 'ibrahim', 'tariq', 'khalid', 'yusuf', 'faisal', 'salman',
  'farhan', 'imran', 'irfan', 'asif', 'rashid', 'nasir', 'arfan', 'adnan', 'amir', 'wasim',
]);

export function getStudentGenderFromName(name, explicitGender = null) {
  // 1. Direct explicit gender check
  if (explicitGender) {
    const g = String(explicitGender).toLowerCase().trim();
    if (['f', 'female', 'girl', 'woman', 'she', 'her'].includes(g)) return 'girl';
    if (['m', 'male', 'boy', 'man', 'he', 'him'].includes(g)) return 'boy';
  }

  if (!name || typeof name !== 'string') return 'boy';

  // 2. Extract first token / name and clean
  const cleanName = name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
  if (!cleanName) return 'boy';

  // 3. Exact male lookup
  if (MALE_NAMES.has(cleanName)) {
    return 'boy';
  }

  // 4. Exact female lookup
  if (FEMALE_NAMES.has(cleanName)) {
    return 'girl';
  }

  // 5. Common female suffix patterns
  const femaleEndings = [
    'priya', 'shree', 'sree', 'devi', 'kumari', 'wati', 'mani', 'rani',
    'ya', 'ka', 'na', 'sha', 'tha', 'ita', 'ika', 'ini', 'ina', 'ria',
    'nya', 'shi', 'tri', 'line', 'ine', 'elle', 'ette'
  ];

  for (const ending of femaleEndings) {
    if (cleanName.endsWith(ending)) {
      return 'girl';
    }
  }

  // Common Indian/Western female name endings in 'a', 'i', 'ee'
  if (cleanName.endsWith('a') || cleanName.endsWith('i') || cleanName.endsWith('ee')) {
    return 'girl';
  }

  return 'boy';
}

