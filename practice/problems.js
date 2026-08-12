/* DSA practice — Top-100 Google-favourite problems, ordered by priority.
   Auto-assembled + validated (every JS reference passes its own test cases).
   I/O model: stdin (flat whitespace tokens) -> stdout (token-compared). */
window.DSA_PROBLEMS = [
  {
    "id": "two-sum",
    "title": "Two Sum",
    "difficulty": "Easy",
    "tags": [
      "Array",
      "Hash Table"
    ],
    "statement": "<p>Given an array of integers <code>nums</code> and a <code>target</code>, return the <strong>indices</strong> of the two numbers that add up to <code>target</code>. Exactly one solution exists; you may not use the same element twice.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers, then <code>target</code>.<br><strong>Output:</strong> the two indices (0-based, smaller first), space-separated.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst nums = d.slice(p, p + n); p += n;\nconst target = d[p++];\n\n// TODO: print the two indices, e.g. console.log(i + ' ' + j);\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    int target; cin >> target;\n\n    // TODO: print the two indices as: i << ' ' << j\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);let p=0;const n=d[p++];const nums=d.slice(p,p+n);p+=n;const target=d[p++];\nconst m=new Map();for(let i=0;i<n;i++){const c=target-nums[i];if(m.has(c)){console.log(m.get(c)+' '+i);break;}m.set(nums[i],i);}"
    },
    "tests": [
      {
        "stdin": "4\n2 7 11 15\n9",
        "expected": "0 1"
      },
      {
        "stdin": "3\n3 2 4\n6",
        "expected": "1 2"
      },
      {
        "stdin": "2\n3 3\n6",
        "expected": "0 1"
      }
    ]
  },
  {
    "id": "valid-anagram",
    "title": "Valid Anagram",
    "difficulty": "Easy",
    "tags": [
      "String",
      "Hash Table"
    ],
    "statement": "<p>Given two strings <code>s</code> and <code>t</code> (lowercase, no spaces), return <code>true</code> if <code>t</code> is an anagram of <code>s</code>.</p>",
    "io": "<p><strong>Input:</strong> two tokens <code>s</code> and <code>t</code>.<br><strong>Output:</strong> <code>true</code> or <code>false</code>.</p>",
    "boiler": {
      "js": "const parts = input.trim().split(/\\s+/);\nconst s = parts[0], t = parts[1];\n\n// TODO: console.log(isAnagram ? 'true' : 'false');\n",
      "cpp": "#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    string s, t;\n    cin >> s >> t;\n\n    // TODO: print \"true\" or \"false\"\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const parts=input.trim().split(/\\s+/);const s=parts[0]||'',t=parts[1]||'';\nconst key=x=>x.split('').sort().join('');console.log(key(s)===key(t)?'true':'false');"
    },
    "tests": [
      {
        "stdin": "anagram nagaram",
        "expected": "true"
      },
      {
        "stdin": "rat car",
        "expected": "false"
      },
      {
        "stdin": "ab ab",
        "expected": "true"
      }
    ]
  },
  {
    "id": "contains-duplicate",
    "title": "Contains Duplicate",
    "difficulty": "Easy",
    "tags": [
      "Array",
      "Hash Table"
    ],
    "statement": "<p>Return <code>true</code> if any value appears at least twice in <code>nums</code>, otherwise <code>false</code>.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers.<br><strong>Output:</strong> <code>true</code> or <code>false</code>.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst nums = d.slice(1, 1 + n);\n\n// TODO: console.log(hasDuplicate ? 'true' : 'false');\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // TODO: print \"true\" or \"false\"\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);const n=d[0];const nums=d.slice(1,1+n);\nconsole.log(new Set(nums).size!==n?'true':'false');"
    },
    "tests": [
      {
        "stdin": "4\n1 2 3 1",
        "expected": "true"
      },
      {
        "stdin": "4\n1 2 3 4",
        "expected": "false"
      },
      {
        "stdin": "1\n1",
        "expected": "false"
      }
    ]
  },
  {
    "id": "best-time-to-buy-and-sell-stock",
    "title": "Best Time to Buy and Sell Stock",
    "difficulty": "Easy",
    "tags": [
      "Array",
      "DP"
    ],
    "statement": "<p>Given daily <code>prices</code>, buy on one day and sell on a later day to maximise profit. Return the maximum profit, or <code>0</code> if none is possible.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> prices.<br><strong>Output:</strong> the maximum profit.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst prices = d.slice(1, 1 + n);\n\n// TODO: console.log(maxProfit);\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> prices(n);\n    for (int i = 0; i < n; i++) cin >> prices[i];\n\n    // TODO: print the max profit\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);const n=d[0];const prices=d.slice(1,1+n);\nlet min=Infinity,best=0;for(const p of prices){if(p<min)min=p;else if(p-min>best)best=p-min;}console.log(best);"
    },
    "tests": [
      {
        "stdin": "6\n7 1 5 3 6 4",
        "expected": "5"
      },
      {
        "stdin": "5\n7 6 4 3 1",
        "expected": "0"
      },
      {
        "stdin": "1\n5",
        "expected": "0"
      }
    ]
  },
  {
    "id": "valid-parentheses",
    "title": "Valid Parentheses",
    "difficulty": "Easy",
    "tags": [
      "String",
      "Stack"
    ],
    "statement": "<p>Given a string of brackets <code>()[]{}</code>, return <code>true</code> if every bracket is correctly opened and closed in the right order.</p>",
    "io": "<p><strong>Input:</strong> one token containing only <code>()[]{}</code>.<br><strong>Output:</strong> <code>true</code> or <code>false</code>.</p>",
    "boiler": {
      "js": "const s = input.trim();\n\n// TODO: console.log(isValid ? 'true' : 'false');\n",
      "cpp": "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n\n    // TODO: print \"true\" or \"false\"\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const s=input.trim();\nconst pairs={')':'(',']':'[','}':'{'};const st=[];let ok=true;for(const c of s){if(c==='('||c==='['||c==='{')st.push(c);else{if(st.pop()!==pairs[c]){ok=false;break;}}}console.log(ok&&st.length===0?'true':'false');"
    },
    "tests": [
      {
        "stdin": "()",
        "expected": "true"
      },
      {
        "stdin": "()[]{}",
        "expected": "true"
      },
      {
        "stdin": "(]",
        "expected": "false"
      },
      {
        "stdin": "([)]",
        "expected": "false"
      },
      {
        "stdin": "{[]}",
        "expected": "true"
      }
    ]
  },
  {
    "id": "binary-search",
    "title": "Binary Search",
    "difficulty": "Easy",
    "tags": [
      "Binary Search"
    ],
    "statement": "<p>Given a sorted (ascending) array and a <code>target</code>, return its index, or <code>-1</code> if absent. Must run in O(log n).</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> sorted integers, then <code>target</code>.<br><strong>Output:</strong> the index or <code>-1</code>.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst nums = d.slice(p, p + n); p += n;\nconst target = d[p++];\n\n// TODO: console.log(index);\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    int target; cin >> target;\n\n    // TODO: print the index or -1\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);let p=0;const n=d[p++];const nums=d.slice(p,p+n);p+=n;const target=d[p++];\nlet lo=0,hi=n-1,ans=-1;while(lo<=hi){const m=(lo+hi)>>1;if(nums[m]===target){ans=m;break;}else if(nums[m]<target)lo=m+1;else hi=m-1;}console.log(ans);"
    },
    "tests": [
      {
        "stdin": "6\n-1 0 3 5 9 12\n9",
        "expected": "4"
      },
      {
        "stdin": "6\n-1 0 3 5 9 12\n2",
        "expected": "-1"
      },
      {
        "stdin": "1\n5\n5",
        "expected": "0"
      }
    ]
  },
  {
    "id": "maximum-subarray",
    "title": "Maximum Subarray",
    "difficulty": "Medium",
    "tags": [
      "Array",
      "DP",
      "Kadane"
    ],
    "statement": "<p>Find the contiguous subarray with the largest sum and return that sum.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers.<br><strong>Output:</strong> the maximum subarray sum.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst nums = d.slice(1, 1 + n);\n\n// TODO: console.log(maxSum);\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // TODO: print the maximum subarray sum\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);const n=d[0];const nums=d.slice(1,1+n);\nlet cur=nums[0],best=nums[0];for(let i=1;i<n;i++){cur=Math.max(nums[i],cur+nums[i]);best=Math.max(best,cur);}console.log(best);"
    },
    "tests": [
      {
        "stdin": "9\n-2 1 -3 4 -1 2 1 -5 4",
        "expected": "6"
      },
      {
        "stdin": "1\n1",
        "expected": "1"
      },
      {
        "stdin": "5\n-1 -2 -3 -4 -5",
        "expected": "-1"
      }
    ]
  },
  {
    "id": "climbing-stairs",
    "title": "Climbing Stairs",
    "difficulty": "Easy",
    "tags": [
      "DP"
    ],
    "statement": "<p>You climb a staircase of <code>n</code> steps, taking 1 or 2 steps at a time. How many distinct ways can you reach the top?</p>",
    "io": "<p><strong>Input:</strong> a single integer <code>n</code>.<br><strong>Output:</strong> the number of ways.</p>",
    "boiler": {
      "js": "const n = Number(input.trim());\n\n// TODO: console.log(ways);\n",
      "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n\n    // TODO: print the number of ways\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const n=Number(input.trim());\nlet a=1,b=1;for(let i=0;i<n;i++){const t=a+b;a=b;b=t;}console.log(a);"
    },
    "tests": [
      {
        "stdin": "2",
        "expected": "2"
      },
      {
        "stdin": "3",
        "expected": "3"
      },
      {
        "stdin": "5",
        "expected": "8"
      }
    ]
  },
  {
    "id": "fibonacci-number",
    "title": "Fibonacci Number",
    "difficulty": "Easy",
    "tags": [
      "DP",
      "Math"
    ],
    "statement": "<p>Return <code>F(n)</code>, where <code>F(0) = 0</code>, <code>F(1) = 1</code>, and <code>F(n) = F(n-1) + F(n-2)</code>.</p>",
    "io": "<p><strong>Input:</strong> a single integer <code>n</code>.<br><strong>Output:</strong> <code>F(n)</code>.</p>",
    "boiler": {
      "js": "const n = Number(input.trim());\n\n// TODO: console.log(result);\n",
      "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n\n    // TODO: print F(n)\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const n=Number(input.trim());\nlet a=0,b=1;for(let i=0;i<n;i++){const t=a+b;a=b;b=t;}console.log(a);"
    },
    "tests": [
      {
        "stdin": "0",
        "expected": "0"
      },
      {
        "stdin": "2",
        "expected": "1"
      },
      {
        "stdin": "4",
        "expected": "3"
      },
      {
        "stdin": "10",
        "expected": "55"
      }
    ]
  },
  {
    "id": "reverse-string",
    "title": "Reverse String",
    "difficulty": "Easy",
    "tags": [
      "String",
      "Two Pointers"
    ],
    "statement": "<p>Return the input string reversed.</p>",
    "io": "<p><strong>Input:</strong> one token (no spaces).<br><strong>Output:</strong> the reversed string.</p>",
    "boiler": {
      "js": "const s = input.trim();\n\n// TODO: console.log(reversed);\n",
      "cpp": "#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n\n    // TODO: print the reversed string\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const s=input.trim();\nconsole.log(s.split('').reverse().join(''));"
    },
    "tests": [
      {
        "stdin": "hello",
        "expected": "olleh"
      },
      {
        "stdin": "a",
        "expected": "a"
      },
      {
        "stdin": "abcd",
        "expected": "dcba"
      }
    ]
  },
  {
    "id": "single-number",
    "title": "Single Number",
    "difficulty": "Easy",
    "tags": [
      "Array",
      "Bit Manipulation"
    ],
    "statement": "<p>Every element appears twice except one. Find the element that appears only once.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers.<br><strong>Output:</strong> the single number.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst nums = d.slice(1, 1 + n);\n\n// TODO: console.log(answer);\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // TODO: print the number that appears once\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);const n=d[0];const nums=d.slice(1,1+n);\nlet x=0;for(const v of nums)x^=v;console.log(x);"
    },
    "tests": [
      {
        "stdin": "3\n2 2 1",
        "expected": "1"
      },
      {
        "stdin": "5\n4 1 2 1 2",
        "expected": "4"
      },
      {
        "stdin": "1\n1",
        "expected": "1"
      }
    ]
  },
  {
    "id": "majority-element",
    "title": "Majority Element",
    "difficulty": "Easy",
    "tags": [
      "Array",
      "Boyer-Moore"
    ],
    "statement": "<p>Return the element that appears more than <code>n/2</code> times (it is guaranteed to exist).</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers.<br><strong>Output:</strong> the majority element.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst nums = d.slice(1, 1 + n);\n\n// TODO: console.log(answer);\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // TODO: print the majority element\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);const n=d[0];const nums=d.slice(1,1+n);\nlet count=0,cand=null;for(const v of nums){if(count===0)cand=v;count+=(v===cand)?1:-1;}console.log(cand);"
    },
    "tests": [
      {
        "stdin": "3\n3 2 3",
        "expected": "3"
      },
      {
        "stdin": "7\n2 2 1 1 1 2 2",
        "expected": "2"
      }
    ]
  },
  {
    "id": "missing-number",
    "title": "Missing Number",
    "difficulty": "Easy",
    "tags": [
      "Array",
      "Math"
    ],
    "statement": "<p>Given <code>n</code> distinct numbers taken from the range <code>0..n</code>, return the one that is missing.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers.<br><strong>Output:</strong> the missing number.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst nums = d.slice(1, 1 + n);\n\n// TODO: console.log(answer);\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // TODO: print the missing number\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);const n=d[0];const nums=d.slice(1,1+n);\nlet s=n*(n+1)/2;for(const v of nums)s-=v;console.log(s);"
    },
    "tests": [
      {
        "stdin": "3\n3 0 1",
        "expected": "2"
      },
      {
        "stdin": "2\n0 1",
        "expected": "2"
      },
      {
        "stdin": "9\n9 6 4 2 3 5 7 0 1",
        "expected": "8"
      }
    ]
  },
  {
    "id": "move-zeroes",
    "title": "Move Zeroes",
    "difficulty": "Easy",
    "tags": [
      "Array",
      "Two Pointers"
    ],
    "statement": "<p>Move all <code>0</code>s to the end while keeping the relative order of the non-zero elements. Return the resulting array.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers.<br><strong>Output:</strong> the array after moving zeroes, space-separated.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst nums = d.slice(1, 1 + n);\n\n// TODO: console.log(nums.join(' '));\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // TODO: print the array after moving zeroes to the end\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);const n=d[0];const nums=d.slice(1,1+n);\nlet j=0;for(let i=0;i<n;i++)if(nums[i]!==0)nums[j++]=nums[i];while(j<n)nums[j++]=0;console.log(nums.join(' '));"
    },
    "tests": [
      {
        "stdin": "5\n0 1 0 3 12",
        "expected": "1 3 12 0 0"
      },
      {
        "stdin": "1\n0",
        "expected": "0"
      },
      {
        "stdin": "3\n1 2 3",
        "expected": "1 2 3"
      }
    ]
  },
  {
    "id": "product-of-array-except-self",
    "title": "Product of Array Except Self",
    "difficulty": "Medium",
    "tags": [
      "Array",
      "Prefix"
    ],
    "statement": "<p>Return an array <code>out</code> where <code>out[i]</code> is the product of all elements except <code>nums[i]</code> — without using division.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers.<br><strong>Output:</strong> the result array, space-separated.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst nums = d.slice(1, 1 + n);\n\n// TODO: console.log(out.join(' '));\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // TODO: print the result array separated by spaces\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);const n=d[0];const nums=d.slice(1,1+n);\nconst out=new Array(n).fill(1);let pre=1;for(let i=0;i<n;i++){out[i]=pre;pre*=nums[i];}let post=1;for(let i=n-1;i>=0;i--){out[i]*=post;post*=nums[i];}console.log(out.join(' '));"
    },
    "tests": [
      {
        "stdin": "4\n1 2 3 4",
        "expected": "24 12 8 6"
      },
      {
        "stdin": "5\n-1 1 0 -3 3",
        "expected": "0 0 9 0 0"
      }
    ]
  },
  {
    "id": "maximum-product-subarray",
    "title": "Maximum Product Subarray",
    "difficulty": "Medium",
    "tags": [
      "Array",
      "DP"
    ],
    "statement": "<p>Find the contiguous subarray with the largest <strong>product</strong> and return that product.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers.<br><strong>Output:</strong> the maximum product.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst nums = d.slice(1, 1 + n);\n\n// TODO: console.log(maxProduct);\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // TODO: print the maximum product\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);const n=d[0];const nums=d.slice(1,1+n);\nlet best=nums[0],hi=nums[0],lo=nums[0];for(let i=1;i<n;i++){const x=nums[i];const a=hi*x,b=lo*x;hi=Math.max(x,a,b);lo=Math.min(x,a,b);best=Math.max(best,hi);}console.log(best);"
    },
    "tests": [
      {
        "stdin": "4\n2 3 -2 4",
        "expected": "6"
      },
      {
        "stdin": "3\n-2 0 -1",
        "expected": "0"
      },
      {
        "stdin": "2\n-2 -3",
        "expected": "6"
      }
    ]
  },
  {
    "id": "search-insert-position",
    "title": "Search Insert Position",
    "difficulty": "Easy",
    "tags": [
      "Binary Search"
    ],
    "statement": "<p>Given a sorted array and a <code>target</code>, return the index where it is, or where it would be inserted to keep the array sorted.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> sorted integers, then <code>target</code>.<br><strong>Output:</strong> the insert index.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst nums = d.slice(p, p + n); p += n;\nconst target = d[p++];\n\n// TODO: console.log(index);\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    int target; cin >> target;\n\n    // TODO: print the insert index\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);let p=0;const n=d[p++];const nums=d.slice(p,p+n);p+=n;const target=d[p++];\nlet lo=0,hi=n;while(lo<hi){const m=(lo+hi)>>1;if(nums[m]<target)lo=m+1;else hi=m;}console.log(lo);"
    },
    "tests": [
      {
        "stdin": "4\n1 3 5 6\n5",
        "expected": "2"
      },
      {
        "stdin": "4\n1 3 5 6\n2",
        "expected": "1"
      },
      {
        "stdin": "4\n1 3 5 6\n7",
        "expected": "4"
      },
      {
        "stdin": "4\n1 3 5 6\n0",
        "expected": "0"
      }
    ]
  },
  {
    "id": "sqrtx",
    "title": "Sqrt(x)",
    "difficulty": "Easy",
    "tags": [
      "Binary Search",
      "Math"
    ],
    "statement": "<p>Given a non-negative integer <code>x</code>, return the integer part of its square root (round down).</p>",
    "io": "<p><strong>Input:</strong> a single integer <code>x</code>.<br><strong>Output:</strong> floor(sqrt(x)).</p>",
    "boiler": {
      "js": "const x = Number(input.trim());\n\n// TODO: console.log(result);\n",
      "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    long long x; cin >> x;\n\n    // TODO: print floor(sqrt(x))\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const x=Number(input.trim());\nif(x<2){console.log(x);}else{let lo=1,hi=x,ans=1;while(lo<=hi){const m=Math.floor((lo+hi)/2);if(m*m<=x){ans=m;lo=m+1;}else hi=m-1;}console.log(ans);}"
    },
    "tests": [
      {
        "stdin": "4",
        "expected": "2"
      },
      {
        "stdin": "8",
        "expected": "2"
      },
      {
        "stdin": "0",
        "expected": "0"
      },
      {
        "stdin": "1",
        "expected": "1"
      }
    ]
  },
  {
    "id": "house-robber",
    "title": "House Robber",
    "difficulty": "Medium",
    "tags": [
      "DP"
    ],
    "statement": "<p>Houses in a row hold money in <code>nums</code>. You cannot rob two adjacent houses. Return the maximum you can rob.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers.<br><strong>Output:</strong> the maximum amount.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst nums = d.slice(1, 1 + n);\n\n// TODO: console.log(maxLoot);\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // TODO: print the maximum amount\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);const n=d[0];const nums=d.slice(1,1+n);\nlet prev=0,cur=0;for(const v of nums){const t=Math.max(cur,prev+v);prev=cur;cur=t;}console.log(cur);"
    },
    "tests": [
      {
        "stdin": "4\n1 2 3 1",
        "expected": "4"
      },
      {
        "stdin": "5\n2 7 9 3 1",
        "expected": "12"
      },
      {
        "stdin": "1\n5",
        "expected": "5"
      }
    ]
  },
  {
    "id": "house-robber-ii",
    "title": "House Robber II",
    "difficulty": "Medium",
    "tags": [
      "DP"
    ],
    "statement": "<p>Same as House Robber, but the houses are arranged in a <strong>circle</strong> — the first and last are adjacent. Return the maximum you can rob.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers.<br><strong>Output:</strong> the maximum amount.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst nums = d.slice(1, 1 + n);\n\n// TODO: console.log(maxLoot);\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // TODO: print the maximum amount\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);const n=d[0];const nums=d.slice(1,1+n);\nif(n===1){console.log(nums[0]);}else{const rob=(a)=>{let prev=0,cur=0;for(const v of a){const t=Math.max(cur,prev+v);prev=cur;cur=t;}return cur;};console.log(Math.max(rob(nums.slice(0,n-1)),rob(nums.slice(1))));}"
    },
    "tests": [
      {
        "stdin": "3\n2 3 2",
        "expected": "3"
      },
      {
        "stdin": "4\n1 2 3 1",
        "expected": "4"
      },
      {
        "stdin": "1\n5",
        "expected": "5"
      }
    ]
  },
  {
    "id": "coin-change",
    "title": "Coin Change",
    "difficulty": "Medium",
    "tags": [
      "DP"
    ],
    "statement": "<p>Given coin denominations and an <code>amount</code>, return the <strong>fewest coins</strong> needed to make the amount, or <code>-1</code> if it cannot be made.</p>",
    "io": "<p><strong>Input:</strong> <code>amount</code>, then <code>n</code>, then <code>n</code> coin values.<br><strong>Output:</strong> the minimum number of coins, or <code>-1</code>.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst amount = d[p++];\nconst n = d[p++];\nconst coins = d.slice(p, p + n);\n\n// TODO: console.log(minCoins);\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int amount; cin >> amount;\n    int n; cin >> n;\n    vector<int> coins(n);\n    for (int i = 0; i < n; i++) cin >> coins[i];\n\n    // TODO: print the minimum number of coins, or -1\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);let p=0;const amount=d[p++];const n=d[p++];const coins=d.slice(p,p+n);\nconst INF=Infinity;const dp=new Array(amount+1).fill(INF);dp[0]=0;for(let a=1;a<=amount;a++){for(const c of coins){if(c<=a&&dp[a-c]+1<dp[a])dp[a]=dp[a-c]+1;}}console.log(dp[amount]===INF?-1:dp[amount]);"
    },
    "tests": [
      {
        "stdin": "11\n3\n1 2 5",
        "expected": "3"
      },
      {
        "stdin": "3\n1\n2",
        "expected": "-1"
      },
      {
        "stdin": "0\n1\n1",
        "expected": "0"
      }
    ]
  },
  {
    "id": "coin-change-ii",
    "title": "Coin Change II",
    "difficulty": "Medium",
    "tags": [
      "DP"
    ],
    "statement": "<p>Given coin denominations and an <code>amount</code>, return the <strong>number of distinct combinations</strong> that make up the amount (order does not matter).</p>",
    "io": "<p><strong>Input:</strong> <code>amount</code>, then <code>n</code>, then <code>n</code> coin values.<br><strong>Output:</strong> the number of combinations.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst amount = d[p++];\nconst n = d[p++];\nconst coins = d.slice(p, p + n);\n\n// TODO: console.log(combinations);\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int amount; cin >> amount;\n    int n; cin >> n;\n    vector<int> coins(n);\n    for (int i = 0; i < n; i++) cin >> coins[i];\n\n    // TODO: print the number of combinations\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);let p=0;const amount=d[p++];const n=d[p++];const coins=d.slice(p,p+n);\nconst dp=new Array(amount+1).fill(0);dp[0]=1;for(const c of coins){for(let a=c;a<=amount;a++)dp[a]+=dp[a-c];}console.log(dp[amount]);"
    },
    "tests": [
      {
        "stdin": "5\n3\n1 2 5",
        "expected": "4"
      },
      {
        "stdin": "3\n1\n2",
        "expected": "0"
      },
      {
        "stdin": "10\n1\n10",
        "expected": "1"
      }
    ]
  },
  {
    "id": "longest-increasing-subsequence",
    "title": "Longest Increasing Subsequence",
    "difficulty": "Medium",
    "tags": [
      "DP",
      "Binary Search"
    ],
    "statement": "<p>Return the length of the longest strictly increasing subsequence of <code>nums</code>.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers.<br><strong>Output:</strong> the LIS length.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst nums = d.slice(1, 1 + n);\n\n// TODO: console.log(lisLength);\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // TODO: print the length of the LIS\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);const n=d[0];const nums=d.slice(1,1+n);\nconst tails=[];for(const x of nums){let lo=0,hi=tails.length;while(lo<hi){const m=(lo+hi)>>1;if(tails[m]<x)lo=m+1;else hi=m;}tails[lo]=x;}console.log(tails.length);"
    },
    "tests": [
      {
        "stdin": "8\n10 9 2 5 3 7 101 18",
        "expected": "4"
      },
      {
        "stdin": "6\n0 1 0 3 2 3",
        "expected": "4"
      },
      {
        "stdin": "7\n7 7 7 7 7 7 7",
        "expected": "1"
      }
    ]
  },
  {
    "id": "jump-game",
    "title": "Jump Game",
    "difficulty": "Medium",
    "tags": [
      "Array",
      "Greedy"
    ],
    "statement": "<p>Each <code>nums[i]</code> is the maximum jump length from index <code>i</code>. Starting at index 0, return <code>true</code> if you can reach the last index.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers.<br><strong>Output:</strong> <code>true</code> or <code>false</code>.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst nums = d.slice(1, 1 + n);\n\n// TODO: console.log(canReach ? 'true' : 'false');\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // TODO: print \"true\" or \"false\"\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);const n=d[0];const nums=d.slice(1,1+n);\nlet reach=0;let ok=true;for(let i=0;i<n;i++){if(i>reach){ok=false;break;}reach=Math.max(reach,i+nums[i]);}console.log(ok?'true':'false');"
    },
    "tests": [
      {
        "stdin": "5\n2 3 1 1 4",
        "expected": "true"
      },
      {
        "stdin": "5\n3 2 1 0 4",
        "expected": "false"
      },
      {
        "stdin": "1\n0",
        "expected": "true"
      }
    ]
  },
  {
    "id": "jump-game-ii",
    "title": "Jump Game II",
    "difficulty": "Medium",
    "tags": [
      "Array",
      "Greedy"
    ],
    "statement": "<p>Each <code>nums[i]</code> is the maximum jump length from index <code>i</code>. Return the <strong>minimum number of jumps</strong> to reach the last index (always reachable).</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers.<br><strong>Output:</strong> the minimum number of jumps.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst nums = d.slice(1, 1 + n);\n\n// TODO: console.log(minJumps);\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // TODO: print the minimum number of jumps\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);const n=d[0];const nums=d.slice(1,1+n);\nlet jumps=0,end=0,far=0;for(let i=0;i<n-1;i++){far=Math.max(far,i+nums[i]);if(i===end){jumps++;end=far;}}console.log(jumps);"
    },
    "tests": [
      {
        "stdin": "5\n2 3 1 1 4",
        "expected": "2"
      },
      {
        "stdin": "5\n2 3 0 1 4",
        "expected": "2"
      },
      {
        "stdin": "1\n0",
        "expected": "0"
      }
    ]
  },
  {
    "id": "two-sum-ii-sorted",
    "title": "Two Sum II - Input Array Is Sorted",
    "difficulty": "Medium",
    "tags": [
      "Array",
      "Two Pointers",
      "Binary Search"
    ],
    "statement": "<p>Given a <strong>1-indexed</strong> array of integers <code>numbers</code> that is already sorted in non-decreasing order, find two numbers such that they add up to a specific <code>target</code>.</p><p>Return the 1-based indices <code>i</code> and <code>j</code> (with <code>i &lt; j</code>) of the two numbers. There is exactly one solution, and each element may be used at most once.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers sorted ascending, then <code>target</code>.<br><strong>Output:</strong> the two 1-based indices <code>i j</code> with <code>i &lt; j</code>.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\nconst target = d[1 + n];\n// TODO: find the two 1-based indices whose values sum to target and print \"i j\" (i < j)\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n; cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) cin >> a[i];\n    int target; cin >> target;\n    // TODO: find the two 1-based indices whose values sum to target and print \"i j\" (i < j)\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\nconst target = d[1 + n];\nlet lo = 0, hi = n - 1;\nwhile (lo < hi) {\n  const s = a[lo] + a[hi];\n  if (s === target) break;\n  else if (s < target) lo++;\n  else hi--;\n}\nconsole.log((lo + 1) + \" \" + (hi + 1));\n"
    },
    "tests": [
      {
        "stdin": "4 2 7 11 15 9",
        "expected": "1 2"
      },
      {
        "stdin": "3 2 3 4 6",
        "expected": "1 3"
      },
      {
        "stdin": "2 -1 0 -1",
        "expected": "1 2"
      },
      {
        "stdin": "5 1 2 3 4 5 8",
        "expected": "3 5"
      }
    ]
  },
  {
    "id": "3sum",
    "title": "3Sum",
    "difficulty": "Medium",
    "tags": [
      "Array",
      "Two Pointers",
      "Sorting"
    ],
    "statement": "<p>Given an integer array <code>nums</code>, return all unique triplets <code>[a, b, c]</code> such that <code>a + b + c = 0</code>. The solution set must not contain duplicate triplets.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers.<br><strong>Output:</strong> every unique triplet summing to 0. Each triplet is printed as its three integers sorted ascending; triplets are ordered so their values appear in ascending order. Print nothing if there are none.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\n// TODO: sort, then print each unique triplet (three ints) summing to 0\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    int n; cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) cin >> a[i];\n    sort(a.begin(), a.end());\n    // TODO: print each unique triplet (three ints) summing to 0\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\na.sort((x, y) => x - y);\nconst res = [];\nfor (let i = 0; i < n; i++) {\n  if (i > 0 && a[i] === a[i - 1]) continue;\n  let lo = i + 1, hi = n - 1;\n  while (lo < hi) {\n    const s = a[i] + a[lo] + a[hi];\n    if (s === 0) {\n      res.push(a[i] + \" \" + a[lo] + \" \" + a[hi]);\n      lo++; hi--;\n      while (lo < hi && a[lo] === a[lo - 1]) lo++;\n      while (lo < hi && a[hi] === a[hi + 1]) hi--;\n    } else if (s < 0) lo++;\n    else hi--;\n  }\n}\nconsole.log(res.join(\"\\n\"));\n"
    },
    "tests": [
      {
        "stdin": "6 -1 0 1 2 -1 -4",
        "expected": "-1 -1 2\n-1 0 1"
      },
      {
        "stdin": "3 0 1 1",
        "expected": ""
      },
      {
        "stdin": "3 0 0 0",
        "expected": "0 0 0"
      },
      {
        "stdin": "4 -2 0 1 1",
        "expected": "-2 1 1"
      }
    ]
  },
  {
    "id": "container-with-most-water",
    "title": "Container With Most Water",
    "difficulty": "Medium",
    "tags": [
      "Array",
      "Two Pointers",
      "Greedy"
    ],
    "statement": "<p>You are given an array <code>height</code> of length <code>n</code>. There are <code>n</code> vertical lines drawn such that the two endpoints of the <code>i</code>-th line are <code>(i, 0)</code> and <code>(i, height[i])</code>.</p><p>Find two lines that together with the x-axis form a container that holds the most water, and return that maximum amount of water.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> heights.<br><strong>Output:</strong> the maximum area (an integer).</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\n// TODO: compute and print the maximum container area\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    int n; cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) cin >> a[i];\n    // TODO: compute and print the maximum container area\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\nlet lo = 0, hi = n - 1, best = 0;\nwhile (lo < hi) {\n  const area = Math.min(a[lo], a[hi]) * (hi - lo);\n  if (area > best) best = area;\n  if (a[lo] < a[hi]) lo++; else hi--;\n}\nconsole.log(best);\n"
    },
    "tests": [
      {
        "stdin": "9 1 8 6 2 5 4 8 3 7",
        "expected": "49"
      },
      {
        "stdin": "2 1 1",
        "expected": "1"
      },
      {
        "stdin": "3 4 3 2",
        "expected": "4"
      },
      {
        "stdin": "4 1 2 4 3",
        "expected": "4"
      }
    ]
  },
  {
    "id": "trapping-rain-water",
    "title": "Trapping Rain Water",
    "difficulty": "Hard",
    "tags": [
      "Array",
      "Two Pointers",
      "Dynamic Programming"
    ],
    "statement": "<p>Given <code>n</code> non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> heights.<br><strong>Output:</strong> the total units of trapped water (an integer).</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\n// TODO: compute and print the total trapped water\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    int n; cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) cin >> a[i];\n    // TODO: compute and print the total trapped water\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\nlet lo = 0, hi = n - 1, leftMax = 0, rightMax = 0, water = 0;\nwhile (lo < hi) {\n  if (a[lo] < a[hi]) {\n    if (a[lo] >= leftMax) leftMax = a[lo];\n    else water += leftMax - a[lo];\n    lo++;\n  } else {\n    if (a[hi] >= rightMax) rightMax = a[hi];\n    else water += rightMax - a[hi];\n    hi--;\n  }\n}\nconsole.log(water);\n"
    },
    "tests": [
      {
        "stdin": "12 0 1 0 2 1 0 1 3 2 1 2 1",
        "expected": "6"
      },
      {
        "stdin": "6 4 2 0 3 2 5",
        "expected": "9"
      },
      {
        "stdin": "3 1 2 3",
        "expected": "0"
      },
      {
        "stdin": "1 5",
        "expected": "0"
      }
    ]
  },
  {
    "id": "longest-substring-without-repeating-characters",
    "title": "Longest Substring Without Repeating Characters",
    "difficulty": "Medium",
    "tags": [
      "String",
      "Sliding Window",
      "Hash Table"
    ],
    "statement": "<p>Given a string <code>s</code>, find the length of the longest substring without repeating characters.</p>",
    "io": "<p><strong>Input:</strong> one string token <code>s</code> (no spaces).<br><strong>Output:</strong> the length of the longest substring without repeating characters (an integer).</p>",
    "boiler": {
      "js": "const s = input.trim();\n// TODO: compute and print the length of the longest substring without repeating characters\n",
      "cpp": "#include <iostream>\n#include <string>\n#include <unordered_map>\nusing namespace std;\nint main() {\n    string s;\n    cin >> s;\n    // TODO: compute and print the length of the longest substring without repeating characters\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const s = input.trim();\nconst last = new Map();\nlet best = 0, start = 0;\nfor (let i = 0; i < s.length; i++) {\n  const c = s[i];\n  if (last.has(c) && last.get(c) >= start) start = last.get(c) + 1;\n  last.set(c, i);\n  if (i - start + 1 > best) best = i - start + 1;\n}\nconsole.log(best);\n"
    },
    "tests": [
      {
        "stdin": "abcabcbb",
        "expected": "3"
      },
      {
        "stdin": "bbbbb",
        "expected": "1"
      },
      {
        "stdin": "pwwkew",
        "expected": "3"
      },
      {
        "stdin": "dvdf",
        "expected": "3"
      }
    ]
  },
  {
    "id": "longest-repeating-character-replacement",
    "title": "Longest Repeating Character Replacement",
    "difficulty": "Medium",
    "tags": [
      "String",
      "Sliding Window",
      "Hash Table"
    ],
    "statement": "<p>You are given a string <code>s</code> consisting of uppercase English letters and an integer <code>k</code>. You may choose at most <code>k</code> characters of the string and change each of them to any other uppercase letter.</p><p>Return the length of the longest substring containing the same letter you can obtain after performing at most <code>k</code> replacements.</p>",
    "io": "<p><strong>Input:</strong> a string token <code>s</code> (uppercase letters, no spaces), then an integer <code>k</code>.<br><strong>Output:</strong> the maximum length (an integer).</p>",
    "boiler": {
      "js": "const parts = input.trim().split(/\\s+/);\nconst s = parts[0];\nconst k = Number(parts[1]);\n// TODO: compute and print the longest repeating-character substring length after at most k replacements\n",
      "cpp": "#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    string s; int k;\n    cin >> s >> k;\n    // TODO: compute and print the longest repeating-character substring length after at most k replacements\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const parts = input.trim().split(/\\s+/);\nconst s = parts[0];\nconst k = Number(parts[1]);\nconst cnt = new Array(26).fill(0);\nlet left = 0, maxCount = 0, best = 0;\nfor (let right = 0; right < s.length; right++) {\n  const idx = s.charCodeAt(right) - 65;\n  cnt[idx]++;\n  if (cnt[idx] > maxCount) maxCount = cnt[idx];\n  while (right - left + 1 - maxCount > k) {\n    cnt[s.charCodeAt(left) - 65]--;\n    left++;\n  }\n  if (right - left + 1 > best) best = right - left + 1;\n}\nconsole.log(best);\n"
    },
    "tests": [
      {
        "stdin": "ABAB 2",
        "expected": "4"
      },
      {
        "stdin": "AABABBA 1",
        "expected": "4"
      },
      {
        "stdin": "AAAA 0",
        "expected": "4"
      },
      {
        "stdin": "ABCDE 1",
        "expected": "2"
      }
    ]
  },
  {
    "id": "max-consecutive-ones-iii",
    "title": "Max Consecutive Ones III",
    "difficulty": "Medium",
    "tags": [
      "Array",
      "Sliding Window"
    ],
    "statement": "<p>Given a binary array <code>nums</code> and an integer <code>k</code>, return the maximum number of consecutive <code>1</code>s in the array if you can flip at most <code>k</code> zeros.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers (each 0 or 1), then an integer <code>k</code>.<br><strong>Output:</strong> the maximum length of consecutive 1s achievable (an integer).</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\nconst k = d[1 + n];\n// TODO: compute and print the max window length containing at most k zeros\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n; cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) cin >> a[i];\n    int k; cin >> k;\n    // TODO: compute and print the max window length containing at most k zeros\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\nconst k = d[1 + n];\nlet left = 0, zeros = 0, best = 0;\nfor (let right = 0; right < n; right++) {\n  if (a[right] === 0) zeros++;\n  while (zeros > k) {\n    if (a[left] === 0) zeros--;\n    left++;\n  }\n  if (right - left + 1 > best) best = right - left + 1;\n}\nconsole.log(best);\n"
    },
    "tests": [
      {
        "stdin": "11 1 1 1 0 0 0 1 1 1 1 0 2",
        "expected": "6"
      },
      {
        "stdin": "6 1 1 1 0 0 0 0",
        "expected": "3"
      },
      {
        "stdin": "5 0 0 0 1 1 2",
        "expected": "4"
      },
      {
        "stdin": "3 1 1 1 0",
        "expected": "3"
      }
    ]
  },
  {
    "id": "minimum-size-subarray-sum",
    "title": "Minimum Size Subarray Sum",
    "difficulty": "Medium",
    "tags": [
      "Array",
      "Sliding Window",
      "Prefix Sum"
    ],
    "statement": "<p>Given an array of positive integers <code>nums</code> and a positive integer <code>target</code>, return the minimal length of a contiguous subarray whose sum is greater than or equal to <code>target</code>. If there is no such subarray, return <code>0</code>.</p>",
    "io": "<p><strong>Input:</strong> <code>target</code>, then <code>n</code>, then <code>n</code> positive integers.<br><strong>Output:</strong> the minimal subarray length (or 0 if none).</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst target = d[0];\nconst n = d[1];\nconst a = d.slice(2, 2 + n);\n// TODO: compute and print the minimal length of a subarray with sum >= target (0 if none)\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int target; cin >> target;\n    int n; cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) cin >> a[i];\n    // TODO: compute and print the minimal length of a subarray with sum >= target (0 if none)\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst target = d[0];\nconst n = d[1];\nconst a = d.slice(2, 2 + n);\nlet left = 0, sum = 0, best = Infinity;\nfor (let right = 0; right < n; right++) {\n  sum += a[right];\n  while (sum >= target) {\n    if (right - left + 1 < best) best = right - left + 1;\n    sum -= a[left];\n    left++;\n  }\n}\nconsole.log(best === Infinity ? 0 : best);\n"
    },
    "tests": [
      {
        "stdin": "7 6 2 3 1 2 4 3",
        "expected": "2"
      },
      {
        "stdin": "4 4 1 4 4 3",
        "expected": "1"
      },
      {
        "stdin": "11 6 1 1 1 1 1 1",
        "expected": "0"
      },
      {
        "stdin": "15 5 1 2 3 4 5",
        "expected": "5"
      }
    ]
  },
  {
    "id": "subarray-sum-equals-k",
    "title": "Subarray Sum Equals K",
    "difficulty": "Medium",
    "tags": [
      "Array",
      "Hash Table",
      "Prefix Sum"
    ],
    "statement": "<p>Given an integer array <code>nums</code> and an integer <code>k</code>, return the total number of contiguous subarrays whose sum equals <code>k</code>.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers, then an integer <code>k</code>.<br><strong>Output:</strong> the count of subarrays summing to <code>k</code> (an integer).</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\nconst k = d[1 + n];\n// TODO: compute and print the number of subarrays summing to k\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\nint main() {\n    int n; cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) cin >> a[i];\n    int k; cin >> k;\n    // TODO: compute and print the number of subarrays summing to k\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\nconst k = d[1 + n];\nconst map = new Map();\nmap.set(0, 1);\nlet sum = 0, count = 0;\nfor (let i = 0; i < n; i++) {\n  sum += a[i];\n  if (map.has(sum - k)) count += map.get(sum - k);\n  map.set(sum, (map.get(sum) || 0) + 1);\n}\nconsole.log(count);\n"
    },
    "tests": [
      {
        "stdin": "3 1 1 1 2",
        "expected": "2"
      },
      {
        "stdin": "3 1 2 3 3",
        "expected": "2"
      },
      {
        "stdin": "5 1 -1 1 -1 1 0",
        "expected": "6"
      },
      {
        "stdin": "2 1 1 0",
        "expected": "0"
      }
    ]
  },
  {
    "id": "find-all-anagrams-in-a-string",
    "title": "Find All Anagrams in a String",
    "difficulty": "Medium",
    "tags": [
      "String",
      "Sliding Window",
      "Hash Table"
    ],
    "statement": "<p>Given two strings <code>s</code> and <code>p</code> consisting of lowercase English letters, return the start indices of all substrings of <code>s</code> that are anagrams of <code>p</code>.</p>",
    "io": "<p><strong>Input:</strong> string token <code>s</code>, then string token <code>p</code> (both lowercase, no spaces).<br><strong>Output:</strong> the start indices in ascending order, space-separated. Print nothing if there are none.</p>",
    "boiler": {
      "js": "const parts = input.trim().split(/\\s+/);\nconst s = parts[0];\nconst p = parts[1];\n// TODO: print the start indices of all anagrams of p in s (ascending)\n",
      "cpp": "#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\nint main() {\n    string s, p;\n    cin >> s >> p;\n    // TODO: print the start indices of all anagrams of p in s (ascending)\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const parts = input.trim().split(/\\s+/);\nconst s = parts[0];\nconst p = parts[1];\nconst need = new Array(26).fill(0);\nfor (let i = 0; i < p.length; i++) need[p.charCodeAt(i) - 97]++;\nconst window = new Array(26).fill(0);\nconst res = [];\nfor (let i = 0; i < s.length; i++) {\n  window[s.charCodeAt(i) - 97]++;\n  if (i >= p.length) window[s.charCodeAt(i - p.length) - 97]--;\n  if (i >= p.length - 1) {\n    let ok = true;\n    for (let j = 0; j < 26; j++) if (window[j] !== need[j]) { ok = false; break; }\n    if (ok) res.push(i - p.length + 1);\n  }\n}\nconsole.log(res.join(\" \"));\n"
    },
    "tests": [
      {
        "stdin": "cbaebabacd abc",
        "expected": "0 6"
      },
      {
        "stdin": "abab ab",
        "expected": "0 1 2"
      },
      {
        "stdin": "aa bb",
        "expected": ""
      },
      {
        "stdin": "aaaa aa",
        "expected": "0 1 2"
      }
    ]
  },
  {
    "id": "sort-colors",
    "title": "Sort Colors",
    "difficulty": "Medium",
    "tags": [
      "Array",
      "Two Pointers",
      "Sorting"
    ],
    "statement": "<p>Given an array <code>nums</code> with <code>n</code> objects colored red, white, or blue (represented by the integers <code>0</code>, <code>1</code>, and <code>2</code>), sort them in-place so that objects of the same color are adjacent, in the order red, white, blue.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers (each 0, 1, or 2).<br><strong>Output:</strong> the sorted array.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\n// TODO: sort the array of 0s, 1s, and 2s and print it\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n; cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) cin >> a[i];\n    // TODO: sort the array of 0s, 1s, and 2s and print it\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\nlet low = 0, mid = 0, high = n - 1;\nwhile (mid <= high) {\n  if (a[mid] === 0) { const t = a[low]; a[low] = a[mid]; a[mid] = t; low++; mid++; }\n  else if (a[mid] === 1) mid++;\n  else { const t = a[mid]; a[mid] = a[high]; a[high] = t; high--; }\n}\nconsole.log(a.join(\" \"));\n"
    },
    "tests": [
      {
        "stdin": "6 2 0 2 1 1 0",
        "expected": "0 0 1 1 2 2"
      },
      {
        "stdin": "3 2 0 1",
        "expected": "0 1 2"
      },
      {
        "stdin": "1 0",
        "expected": "0"
      },
      {
        "stdin": "4 2 2 1 0",
        "expected": "0 1 2 2"
      }
    ]
  },
  {
    "id": "next-permutation",
    "title": "Next Permutation",
    "difficulty": "Medium",
    "tags": [
      "Array",
      "Two Pointers"
    ],
    "statement": "<p>Implement <strong>next permutation</strong>, which rearranges numbers into the lexicographically next greater permutation of numbers. If such an arrangement is not possible (the array is the largest permutation), rearrange it as the lowest possible order (sorted in ascending order).</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers.<br><strong>Output:</strong> the next permutation.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\n// TODO: transform a into its next lexicographic permutation and print it\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    int n; cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) cin >> a[i];\n    // TODO: transform a into its next lexicographic permutation and print it\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\nlet i = n - 2;\nwhile (i >= 0 && a[i] >= a[i + 1]) i--;\nif (i >= 0) {\n  let j = n - 1;\n  while (a[j] <= a[i]) j--;\n  const t = a[i]; a[i] = a[j]; a[j] = t;\n}\nlet l = i + 1, r = n - 1;\nwhile (l < r) { const t = a[l]; a[l] = a[r]; a[r] = t; l++; r--; }\nconsole.log(a.join(\" \"));\n"
    },
    "tests": [
      {
        "stdin": "3 1 2 3",
        "expected": "1 3 2"
      },
      {
        "stdin": "3 3 2 1",
        "expected": "1 2 3"
      },
      {
        "stdin": "3 1 1 5",
        "expected": "1 5 1"
      },
      {
        "stdin": "4 1 3 2 4",
        "expected": "1 3 4 2"
      }
    ]
  },
  {
    "id": "rotate-array",
    "title": "Rotate Array",
    "difficulty": "Medium",
    "tags": [
      "Array",
      "Two Pointers",
      "Math"
    ],
    "statement": "<p>Given an integer array <code>nums</code>, rotate the array to the right by <code>k</code> steps, where <code>k</code> is non-negative.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers, then an integer <code>k</code>.<br><strong>Output:</strong> the array after rotating right by <code>k</code>.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\nconst k = d[1 + n];\n// TODO: rotate a to the right by k and print it\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n; cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) cin >> a[i];\n    int k; cin >> k;\n    // TODO: rotate a to the right by k and print it\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\nconst k = d[1 + n];\nconst kk = n === 0 ? 0 : k % n;\nconst res = a.slice(n - kk).concat(a.slice(0, n - kk));\nconsole.log(res.join(\" \"));\n"
    },
    "tests": [
      {
        "stdin": "7 1 2 3 4 5 6 7 3",
        "expected": "5 6 7 1 2 3 4"
      },
      {
        "stdin": "4 -1 -100 3 99 2",
        "expected": "3 99 -1 -100"
      },
      {
        "stdin": "3 1 2 3 0",
        "expected": "1 2 3"
      },
      {
        "stdin": "5 1 2 3 4 5 7",
        "expected": "4 5 1 2 3"
      }
    ]
  },
  {
    "id": "merge-sorted-array",
    "title": "Merge Sorted Array",
    "difficulty": "Easy",
    "tags": [
      "Array",
      "Two Pointers",
      "Sorting"
    ],
    "statement": "<p>You are given two integer arrays that are each sorted in non-decreasing order. Merge them into a single array sorted in non-decreasing order.</p>",
    "io": "<p><strong>Input:</strong> <code>m</code>, then <code>m</code> sorted integers, then <code>n</code>, then <code>n</code> sorted integers.<br><strong>Output:</strong> the merged sorted array of size <code>m + n</code>.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst m = d[0];\nconst a = d.slice(1, 1 + m);\nconst n = d[1 + m];\nconst b = d.slice(2 + m, 2 + m + n);\n// TODO: merge the two sorted arrays and print the result\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int m; cin >> m;\n    vector<int> a(m);\n    for (int i = 0; i < m; i++) cin >> a[i];\n    int n; cin >> n;\n    vector<int> b(n);\n    for (int i = 0; i < n; i++) cin >> b[i];\n    // TODO: merge the two sorted arrays and print the result\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst m = d[0];\nconst a = d.slice(1, 1 + m);\nconst n = d[1 + m];\nconst b = d.slice(2 + m, 2 + m + n);\nconst res = [];\nlet i = 0, j = 0;\nwhile (i < m && j < n) {\n  if (a[i] <= b[j]) res.push(a[i++]);\n  else res.push(b[j++]);\n}\nwhile (i < m) res.push(a[i++]);\nwhile (j < n) res.push(b[j++]);\nconsole.log(res.join(\" \"));\n"
    },
    "tests": [
      {
        "stdin": "3 1 2 3 3 2 5 6",
        "expected": "1 2 2 3 5 6"
      },
      {
        "stdin": "1 1 0",
        "expected": "1"
      },
      {
        "stdin": "0 3 1 2 3",
        "expected": "1 2 3"
      },
      {
        "stdin": "2 1 5 3 2 4 6",
        "expected": "1 2 4 5 6"
      }
    ]
  },
  {
    "id": "remove-duplicates-from-sorted-array",
    "title": "Remove Duplicates from Sorted Array",
    "difficulty": "Easy",
    "tags": [
      "Array",
      "Two Pointers"
    ],
    "statement": "<p>Given an integer array <code>nums</code> sorted in non-decreasing order, remove the duplicates in-place so that each unique element appears only once, keeping their relative order.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> sorted integers.<br><strong>Output:</strong> the de-duplicated array (unique values in order).</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\n// TODO: print the unique values of the sorted array in order\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n; cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) cin >> a[i];\n    // TODO: print the unique values of the sorted array in order\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\nconst res = [];\nfor (let i = 0; i < n; i++) {\n  if (i === 0 || a[i] !== a[i - 1]) res.push(a[i]);\n}\nconsole.log(res.join(\" \"));\n"
    },
    "tests": [
      {
        "stdin": "3 1 1 2",
        "expected": "1 2"
      },
      {
        "stdin": "10 0 0 1 1 1 2 2 3 3 4",
        "expected": "0 1 2 3 4"
      },
      {
        "stdin": "1 5",
        "expected": "5"
      },
      {
        "stdin": "5 1 2 3 4 5",
        "expected": "1 2 3 4 5"
      }
    ]
  },
  {
    "id": "min-stack",
    "title": "Min Stack",
    "difficulty": "Medium",
    "tags": [
      "Stack",
      "Design"
    ],
    "statement": "<p>Design a stack that supports <code>push</code>, <code>pop</code>, <code>top</code>, and retrieving the minimum element (<code>getMin</code>), all in O(1) time.</p>",
    "io": "<p><strong>Input:</strong> <code>q</code>, then <code>q</code> operations. Each is one of <code>push x</code>, <code>pop</code>, <code>top</code>, <code>getMin</code> (as whitespace tokens).<br><strong>Output:</strong> for every <code>top</code> and <code>getMin</code>, the resulting value, one per line, in order. <code>push</code> and <code>pop</code> print nothing.</p>",
    "boiler": {
      "js": "const t = input.trim().split(/\\s+/);\nlet p = 0;\nconst q = parseInt(t[p++], 10);\nconst out = [];\nfor (let i = 0; i < q; i++) {\n  const op = t[p++];\n  if (op === 'push') { const x = parseInt(t[p++], 10); /* TODO */ }\n  else if (op === 'pop') { /* TODO */ }\n  else if (op === 'top') { /* TODO: out.push(...) */ }\n  else if (op === 'getMin') { /* TODO: out.push(...) */ }\n}\nconsole.log(out.join('\\n'));\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\nint main() {\n    int q; cin >> q;\n    for (int i = 0; i < q; i++) {\n        string op; cin >> op;\n        if (op == \"push\") { int x; cin >> x; /* TODO */ }\n        else if (op == \"pop\") { /* TODO */ }\n        else if (op == \"top\") { /* TODO: print value */ }\n        else if (op == \"getMin\") { /* TODO: print value */ }\n    }\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const t=input.trim().split(/\\s+/);let p=0;const q=parseInt(t[p++],10);const st=[],mn=[],out=[];for(let i=0;i<q;i++){const op=t[p++];if(op==='push'){const x=parseInt(t[p++],10);st.push(x);mn.push(mn.length?Math.min(x,mn[mn.length-1]):x);}else if(op==='pop'){st.pop();mn.pop();}else if(op==='top'){out.push(st[st.length-1]);}else if(op==='getMin'){out.push(mn[mn.length-1]);}}console.log(out.join('\\n'));"
    },
    "tests": [
      {
        "stdin": "8\npush 3\npush 5\ngetMin\ntop\npush 2\ngetMin\npop\ngetMin",
        "expected": "3\n5\n2\n3"
      },
      {
        "stdin": "5\npush -2\npush 0\npush -3\ngetMin\npop",
        "expected": "-3"
      },
      {
        "stdin": "6\npush 1\ntop\ngetMin\npush 1\npop\ntop",
        "expected": "1\n1\n1"
      },
      {
        "stdin": "4\npush 10\ngetMin\ntop\ngetMin",
        "expected": "10\n10\n10"
      }
    ]
  },
  {
    "id": "evaluate-reverse-polish-notation",
    "title": "Evaluate Reverse Polish Notation",
    "difficulty": "Medium",
    "tags": [
      "Stack",
      "Math"
    ],
    "statement": "<p>Evaluate an arithmetic expression given in <strong>Reverse Polish Notation</strong>. Valid operators are <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>. Division truncates toward zero.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> tokens, each an integer or an operator.<br><strong>Output:</strong> the integer result.</p>",
    "boiler": {
      "js": "const t = input.trim().split(/\\s+/);\nconst n = parseInt(t[0], 10);\nconst toks = t.slice(1, 1 + n);\n\n// TODO: evaluate RPN and console.log(result);\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <string>\n#include <stack>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<string> toks(n);\n    for (int i = 0; i < n; i++) cin >> toks[i];\n\n    // TODO: evaluate RPN and print result\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const t=input.trim().split(/\\s+/);const n=parseInt(t[0],10);const toks=t.slice(1,1+n);const st=[];const isOp=(s)=>s==='+'||s==='-'||s==='*'||s==='/';for(const tk of toks){if(isOp(tk)){const a=st.pop(),b=st.pop();let r;if(tk==='+')r=b+a;else if(tk==='-')r=b-a;else if(tk==='*')r=b*a;else r=Math.trunc(b/a);st.push(r);}else{st.push(parseInt(tk,10));}}console.log(st[0]);"
    },
    "tests": [
      {
        "stdin": "5\n2 1 + 3 *",
        "expected": "9"
      },
      {
        "stdin": "3\n10 3 /",
        "expected": "3"
      },
      {
        "stdin": "3\n4 -2 /",
        "expected": "-2"
      },
      {
        "stdin": "13\n10 6 9 3 + -11 * / * 17 + 5 +",
        "expected": "22"
      },
      {
        "stdin": "1\n42",
        "expected": "42"
      }
    ]
  },
  {
    "id": "daily-temperatures",
    "title": "Daily Temperatures",
    "difficulty": "Medium",
    "tags": [
      "Stack",
      "Array",
      "Monotonic Stack"
    ],
    "statement": "<p>Given daily temperatures, return an array where <code>out[i]</code> is the number of days you must wait after day <code>i</code> to get a warmer temperature. If none exists, <code>out[i] = 0</code>.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers.<br><strong>Output:</strong> the <code>n</code> result values, space/line separated.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\n\n// TODO: build res[] and console.log(res.join('\\n'));\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <stack>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) cin >> a[i];\n\n    // TODO: compute days-until-warmer and print each\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);const n=d[0];const a=d.slice(1,1+n);const res=new Array(n).fill(0);const st=[];for(let i=0;i<n;i++){while(st.length&&a[i]>a[st[st.length-1]]){const j=st.pop();res[j]=i-j;}st.push(i);}console.log(res.join('\\n'));"
    },
    "tests": [
      {
        "stdin": "8\n73 74 75 71 69 72 76 73",
        "expected": "1 1 4 2 1 1 0 0"
      },
      {
        "stdin": "4\n30 40 50 60",
        "expected": "1 1 1 0"
      },
      {
        "stdin": "3\n30 60 90",
        "expected": "1 1 0"
      },
      {
        "stdin": "1\n50",
        "expected": "0"
      }
    ]
  },
  {
    "id": "next-greater-element-ii",
    "title": "Next Greater Element II",
    "difficulty": "Medium",
    "tags": [
      "Stack",
      "Array",
      "Monotonic Stack"
    ],
    "statement": "<p>Given a <strong>circular</strong> integer array, return the next greater element for every position. The next greater element of <code>x</code> is the first larger number encountered while traversing the array circularly. If none exists, the answer is <code>-1</code>.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers.<br><strong>Output:</strong> the <code>n</code> answers, space/line separated.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst a = d.slice(1, 1 + n);\n\n// TODO: build res[] (circular) and console.log(res.join('\\n'));\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <stack>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) cin >> a[i];\n\n    // TODO: compute circular next-greater and print each\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);const n=d[0];const a=d.slice(1,1+n);const res=new Array(n).fill(-1);const st=[];for(let i=0;i<2*n;i++){const idx=i%n;while(st.length&&a[idx]>a[st[st.length-1]]){res[st.pop()]=a[idx];}if(i<n)st.push(idx);}console.log(res.join('\\n'));"
    },
    "tests": [
      {
        "stdin": "3\n1 2 1",
        "expected": "2 -1 2"
      },
      {
        "stdin": "5\n1 2 3 4 3",
        "expected": "2 3 4 -1 4"
      },
      {
        "stdin": "2\n5 5",
        "expected": "-1 -1"
      },
      {
        "stdin": "1\n7",
        "expected": "-1"
      }
    ]
  },
  {
    "id": "largest-rectangle-in-histogram",
    "title": "Largest Rectangle in Histogram",
    "difficulty": "Hard",
    "tags": [
      "Stack",
      "Array",
      "Monotonic Stack"
    ],
    "statement": "<p>Given the bar heights of a histogram (each bar width 1), return the area of the largest rectangle that fits entirely within the histogram.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integer heights.<br><strong>Output:</strong> the maximum rectangle area.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst n = d[0];\nconst h = d.slice(1, 1 + n);\n\n// TODO: compute max area and console.log(maxArea);\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <stack>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> h(n);\n    for (int i = 0; i < n; i++) cin >> h[i];\n\n    // TODO: compute and print the max rectangle area\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);const n=d[0];const h=d.slice(1,1+n);const st=[];let max=0;for(let i=0;i<=n;i++){const cur=i<n?h[i]:0;while(st.length&&h[st[st.length-1]]>cur){const height=h[st.pop()];const width=st.length?i-st[st.length-1]-1:i;if(height*width>max)max=height*width;}st.push(i);}console.log(max);"
    },
    "tests": [
      {
        "stdin": "6\n2 1 5 6 2 3",
        "expected": "10"
      },
      {
        "stdin": "2\n2 4",
        "expected": "4"
      },
      {
        "stdin": "1\n5",
        "expected": "5"
      },
      {
        "stdin": "5\n2 2 2 2 2",
        "expected": "10"
      }
    ]
  },
  {
    "id": "generate-parentheses",
    "title": "Generate Parentheses",
    "difficulty": "Medium",
    "tags": [
      "Backtracking",
      "String"
    ],
    "statement": "<p>Given <code>n</code> pairs of parentheses, generate all combinations of well-formed parentheses.</p>",
    "io": "<p><strong>Input:</strong> a single integer <code>n</code>.<br><strong>Output:</strong> every valid combination, sorted in ascending string order, one per line.</p>",
    "boiler": {
      "js": "const n = parseInt(input.trim().split(/\\s+/)[0], 10);\n\n// TODO: generate all valid combinations, sort ascending, print each on its own line\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n\n    // TODO: generate all valid combinations, sort ascending, print each\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const n=parseInt(input.trim().split(/\\s+/)[0],10);const res=[];function bt(cur,open,close){if(cur.length===2*n){res.push(cur);return;}if(open<n)bt(cur+'(',open+1,close);if(close<open)bt(cur+')',open,close+1);}bt('',0,0);res.sort();console.log(res.join('\\n'));"
    },
    "tests": [
      {
        "stdin": "1",
        "expected": "()"
      },
      {
        "stdin": "2",
        "expected": "(())\n()()"
      },
      {
        "stdin": "3",
        "expected": "((()))\n(()())\n(())()\n()(())\n()()()"
      }
    ]
  },
  {
    "id": "merge-intervals",
    "title": "Merge Intervals",
    "difficulty": "Medium",
    "tags": [
      "Array",
      "Sorting",
      "Intervals"
    ],
    "statement": "<p>Given a collection of intervals, merge all overlapping intervals and return the resulting non-overlapping intervals.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> pairs <code>a b</code>.<br><strong>Output:</strong> the merged intervals sorted by start, each printed as <code>a b</code>.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst iv = [];\nfor (let i = 0; i < n; i++) iv.push([d[p++], d[p++]]);\n\n// TODO: merge and print each interval as 'a b'\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<pair<int,int>> iv(n);\n    for (int i = 0; i < n; i++) cin >> iv[i].first >> iv[i].second;\n\n    // TODO: merge and print each interval as: a << ' ' << b\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);let p=0;const n=d[p++];const iv=[];for(let i=0;i<n;i++)iv.push([d[p++],d[p++]]);iv.sort((x,y)=>x[0]-y[0]);const res=[];for(const [s,e] of iv){if(res.length&&s<=res[res.length-1][1]){res[res.length-1][1]=Math.max(res[res.length-1][1],e);}else{res.push([s,e]);}}console.log(res.map(x=>x[0]+' '+x[1]).join('\\n'));"
    },
    "tests": [
      {
        "stdin": "4\n1 3\n2 6\n8 10\n15 18",
        "expected": "1 6\n8 10\n15 18"
      },
      {
        "stdin": "2\n1 4\n4 5",
        "expected": "1 5"
      },
      {
        "stdin": "1\n1 4",
        "expected": "1 4"
      },
      {
        "stdin": "3\n1 4\n0 4\n3 5",
        "expected": "0 5"
      }
    ]
  },
  {
    "id": "insert-interval",
    "title": "Insert Interval",
    "difficulty": "Medium",
    "tags": [
      "Array",
      "Intervals"
    ],
    "statement": "<p>Given a set of non-overlapping intervals sorted by start, insert a new interval, merging where necessary, and return the resulting set of non-overlapping intervals.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> pairs (sorted, non-overlapping), then a new pair <code>a b</code>.<br><strong>Output:</strong> the merged intervals, each printed as <code>a b</code>.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst iv = [];\nfor (let i = 0; i < n; i++) iv.push([d[p++], d[p++]]);\nconst newIv = [d[p++], d[p++]];\n\n// TODO: insert newIv, merge, and print each interval as 'a b'\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<pair<int,int>> iv(n);\n    for (int i = 0; i < n; i++) cin >> iv[i].first >> iv[i].second;\n    int ns, ne; cin >> ns >> ne;\n\n    // TODO: insert, merge, and print each interval as: a << ' ' << b\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);let p=0;const n=d[p++];const iv=[];for(let i=0;i<n;i++)iv.push([d[p++],d[p++]]);let[ns,ne]=[d[p++],d[p++]];const res=[];let i=0;while(i<n&&iv[i][1]<ns){res.push(iv[i]);i++;}while(i<n&&iv[i][0]<=ne){ns=Math.min(ns,iv[i][0]);ne=Math.max(ne,iv[i][1]);i++;}res.push([ns,ne]);while(i<n){res.push(iv[i]);i++;}console.log(res.map(x=>x[0]+' '+x[1]).join('\\n'));"
    },
    "tests": [
      {
        "stdin": "2\n1 3\n6 9\n2 5",
        "expected": "1 5\n6 9"
      },
      {
        "stdin": "5\n1 2\n3 5\n6 7\n8 10\n12 16\n4 8",
        "expected": "1 2\n3 10\n12 16"
      },
      {
        "stdin": "0\n5 7",
        "expected": "5 7"
      },
      {
        "stdin": "3\n1 2\n5 6\n9 10\n3 4",
        "expected": "1 2\n3 4\n5 6\n9 10"
      }
    ]
  },
  {
    "id": "non-overlapping-intervals",
    "title": "Non-overlapping Intervals",
    "difficulty": "Medium",
    "tags": [
      "Greedy",
      "Sorting",
      "Intervals"
    ],
    "statement": "<p>Given a set of intervals, return the minimum number of intervals you must remove so that the remaining intervals do not overlap. Intervals that only touch at an endpoint are not considered overlapping.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> pairs <code>a b</code>.<br><strong>Output:</strong> the minimum number of removals.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst iv = [];\nfor (let i = 0; i < n; i++) iv.push([d[p++], d[p++]]);\n\n// TODO: compute min removals and console.log(count);\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<pair<int,int>> iv(n);\n    for (int i = 0; i < n; i++) cin >> iv[i].first >> iv[i].second;\n\n    // TODO: compute and print min removals\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);let p=0;const n=d[p++];const iv=[];for(let i=0;i<n;i++)iv.push([d[p++],d[p++]]);iv.sort((a,b)=>a[1]-b[1]);let prevEnd=-Infinity,removed=0;for(const [s,e] of iv){if(s>=prevEnd){prevEnd=e;}else{removed++;}}console.log(removed);"
    },
    "tests": [
      {
        "stdin": "4\n1 2\n2 3\n3 4\n1 3",
        "expected": "1"
      },
      {
        "stdin": "3\n1 2\n1 2\n1 2",
        "expected": "2"
      },
      {
        "stdin": "2\n1 2\n2 3",
        "expected": "0"
      },
      {
        "stdin": "1\n1 5",
        "expected": "0"
      }
    ]
  },
  {
    "id": "meeting-rooms-ii",
    "title": "Meeting Rooms II",
    "difficulty": "Medium",
    "tags": [
      "Sorting",
      "Greedy",
      "Intervals"
    ],
    "statement": "<p>Given a list of meeting time intervals, return the minimum number of conference rooms required so that no two overlapping meetings share a room. A meeting that ends at time <code>t</code> frees the room for a meeting that starts at <code>t</code>.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> pairs <code>start end</code>.<br><strong>Output:</strong> the minimum number of rooms.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst iv = [];\nfor (let i = 0; i < n; i++) iv.push([d[p++], d[p++]]);\n\n// TODO: compute min rooms and console.log(rooms);\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> starts(n), ends(n);\n    for (int i = 0; i < n; i++) cin >> starts[i] >> ends[i];\n\n    // TODO: compute and print min rooms\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);let p=0;const n=d[p++];const starts=[],ends=[];for(let i=0;i<n;i++){starts.push(d[p++]);ends.push(d[p++]);}starts.sort((a,b)=>a-b);ends.sort((a,b)=>a-b);let i=0,j=0,rooms=0,max=0;while(i<n){if(starts[i]<ends[j]){rooms++;i++;if(rooms>max)max=rooms;}else{rooms--;j++;}}console.log(max);"
    },
    "tests": [
      {
        "stdin": "3\n0 30\n5 10\n15 20",
        "expected": "2"
      },
      {
        "stdin": "2\n7 10\n2 4",
        "expected": "1"
      },
      {
        "stdin": "3\n1 5\n2 6\n3 7",
        "expected": "3"
      },
      {
        "stdin": "1\n1 2",
        "expected": "1"
      }
    ]
  },
  {
    "id": "group-anagrams",
    "title": "Group Anagrams",
    "difficulty": "Medium",
    "tags": [
      "Hash Table",
      "String",
      "Sorting"
    ],
    "statement": "<p>Given an array of strings, group the anagrams together. Two strings are anagrams if one is a rearrangement of the other.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> string tokens.<br><strong>Output:</strong> canonical form — within each group the words are sorted ascending, and the groups are ordered by their sorted word lists. Print every word (all groups concatenated) as tokens.</p>",
    "boiler": {
      "js": "const t = input.trim().split(/\\s+/);\nconst n = parseInt(t[0], 10);\nconst words = t.slice(1, 1 + n);\n\n// TODO: group anagrams, sort within groups, sort groups, print all words\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <unordered_map>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<string> words(n);\n    for (int i = 0; i < n; i++) cin >> words[i];\n\n    // TODO: group, sort within/among groups, print all words\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const t=input.trim().split(/\\s+/);const n=parseInt(t[0],10);const words=t.slice(1,1+n);const m=new Map();for(const w of words){const k=w.split('').sort().join('');if(!m.has(k))m.set(k,[]);m.get(k).push(w);}const groups=[...m.values()];for(const g of groups)g.sort();groups.sort((a,b)=>{const x=a.join(' '),y=b.join(' ');return x<y?-1:x>y?1:0;});const out=[];for(const g of groups)for(const w of g)out.push(w);console.log(out.join('\\n'));"
    },
    "tests": [
      {
        "stdin": "6\neat tea tan ate nat bat",
        "expected": "ate eat tea bat nat tan"
      },
      {
        "stdin": "1\nabc",
        "expected": "abc"
      },
      {
        "stdin": "3\na b c",
        "expected": "a b c"
      },
      {
        "stdin": "3\nlisten silent enlist",
        "expected": "enlist listen silent"
      }
    ]
  },
  {
    "id": "longest-common-prefix",
    "title": "Longest Common Prefix",
    "difficulty": "Easy",
    "tags": [
      "String"
    ],
    "statement": "<p>Find the longest common prefix string shared by an array of strings. If there is no common prefix, the answer is the empty string.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> string tokens.<br><strong>Output:</strong> the longest common prefix (print nothing if it is empty).</p>",
    "boiler": {
      "js": "const t = input.trim().split(/\\s+/);\nconst n = parseInt(t[0], 10);\nconst words = t.slice(1, 1 + n);\n\n// TODO: compute the longest common prefix and console.log it\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<string> words(n);\n    for (int i = 0; i < n; i++) cin >> words[i];\n\n    // TODO: compute and print the longest common prefix\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const t=input.trim().split(/\\s+/);const n=parseInt(t[0],10);const words=t.slice(1,1+n);let pre=n>0?words[0]:'';for(let i=1;i<n;i++){let j=0;const w=words[i];while(j<pre.length&&j<w.length&&pre[j]===w[j])j++;pre=pre.slice(0,j);if(pre==='')break;}console.log(pre);"
    },
    "tests": [
      {
        "stdin": "3\nflower flow flight",
        "expected": "fl"
      },
      {
        "stdin": "3\ndog racecar car",
        "expected": ""
      },
      {
        "stdin": "1\nhello",
        "expected": "hello"
      },
      {
        "stdin": "2\nabab aba",
        "expected": "aba"
      }
    ]
  },
  {
    "id": "is-subsequence",
    "title": "Is Subsequence",
    "difficulty": "Easy",
    "tags": [
      "Two Pointers",
      "String"
    ],
    "statement": "<p>Given two strings <code>s</code> and <code>t</code>, return whether <code>s</code> is a subsequence of <code>t</code>. A subsequence is formed by deleting some (possibly zero) characters of <code>t</code> without changing the relative order of the remaining characters.</p>",
    "io": "<p><strong>Input:</strong> string <code>s</code> token, then string <code>t</code> token.<br><strong>Output:</strong> <code>true</code> or <code>false</code>.</p>",
    "boiler": {
      "js": "const t = input.trim().split(/\\s+/);\nconst s = t[0];\nconst str = t[1];\n\n// TODO: console.log(isSubsequence ? 'true' : 'false');\n",
      "cpp": "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s, t; cin >> s >> t;\n\n    // TODO: print \"true\" or \"false\"\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const t=input.trim().split(/\\s+/);const s=t[0];const str=t[1];let i=0;for(let j=0;j<str.length&&i<s.length;j++){if(str[j]===s[i])i++;}console.log(i===s.length?'true':'false');"
    },
    "tests": [
      {
        "stdin": "abc ahbgdc",
        "expected": "true"
      },
      {
        "stdin": "axc ahbgdc",
        "expected": "false"
      },
      {
        "stdin": "ace abcde",
        "expected": "true"
      },
      {
        "stdin": "aaa aa",
        "expected": "false"
      }
    ]
  },
  {
    "id": "valid-palindrome",
    "title": "Valid Palindrome",
    "difficulty": "Easy",
    "tags": [
      "Two Pointers",
      "String"
    ],
    "statement": "<p>Given a string consisting only of lowercase letters and digits, return whether it reads the same forwards and backwards.</p>",
    "io": "<p><strong>Input:</strong> a single token of lowercase letters and digits (already cleaned).<br><strong>Output:</strong> <code>true</code> or <code>false</code>.</p>",
    "boiler": {
      "js": "const s = input.trim().split(/\\s+/)[0];\n\n// TODO: console.log(isPalindrome ? 'true' : 'false');\n",
      "cpp": "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s; cin >> s;\n\n    // TODO: print \"true\" or \"false\"\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const s=input.trim().split(/\\s+/)[0];let i=0,j=s.length-1,ok=true;while(i<j){if(s[i]!==s[j]){ok=false;break;}i++;j--;}console.log(ok?'true':'false');"
    },
    "tests": [
      {
        "stdin": "racecar",
        "expected": "true"
      },
      {
        "stdin": "hello",
        "expected": "false"
      },
      {
        "stdin": "a",
        "expected": "true"
      },
      {
        "stdin": "0p0",
        "expected": "true"
      },
      {
        "stdin": "ab",
        "expected": "false"
      }
    ]
  },
  {
    "id": "roman-to-integer",
    "title": "Roman to Integer",
    "difficulty": "Easy",
    "tags": [
      "Hash Table",
      "Math",
      "String"
    ],
    "statement": "<p>Given a Roman numeral, convert it to an integer. Roman numerals use the symbols I(1), V(5), X(10), L(50), C(100), D(500), M(1000); when a smaller symbol precedes a larger one it is subtracted.</p>",
    "io": "<p><strong>Input:</strong> a single Roman-numeral token, e.g. <code>MCMXCIV</code>.<br><strong>Output:</strong> the integer value.</p>",
    "boiler": {
      "js": "const s = input.trim().split(/\\s+/)[0];\n\n// TODO: convert the Roman numeral and console.log(value);\n",
      "cpp": "#include <iostream>\n#include <string>\n#include <unordered_map>\nusing namespace std;\n\nint main() {\n    string s; cin >> s;\n\n    // TODO: convert and print the integer value\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const s=input.trim().split(/\\s+/)[0];const m={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};let total=0;for(let i=0;i<s.length;i++){const v=m[s[i]];if(i+1<s.length&&v<m[s[i+1]])total-=v;else total+=v;}console.log(total);"
    },
    "tests": [
      {
        "stdin": "III",
        "expected": "3"
      },
      {
        "stdin": "IV",
        "expected": "4"
      },
      {
        "stdin": "LVIII",
        "expected": "58"
      },
      {
        "stdin": "MCMXCIV",
        "expected": "1994"
      },
      {
        "stdin": "MMXXVI",
        "expected": "2026"
      }
    ]
  },
  {
    "id": "search-in-rotated-sorted-array",
    "title": "Search in Rotated Sorted Array",
    "difficulty": "Medium",
    "tags": [
      "array",
      "binary-search"
    ],
    "statement": "<p>An ascending sorted array of <strong>distinct</strong> integers has been rotated at an unknown pivot. Given the rotated array and a <code>target</code>, return the index of <code>target</code>, or <code>-1</code> if it is not present. Aim for O(log n).</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers (rotated sorted, distinct), then <code>target</code>.<br><strong>Output:</strong> the index of <code>target</code>, or <code>-1</code>.</p>",
    "boiler": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst n = t[0];\nconst nums = t.slice(1, 1 + n);\nconst target = t[1 + n];\n// TODO: binary search the rotated array; print the index of target or -1\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){\n  int n; cin >> n;\n  vector<int> nums(n);\n  for(int i=0;i<n;i++) cin >> nums[i];\n  int target; cin >> target;\n  // TODO: binary search the rotated array; print the index of target or -1\n  return 0;\n}\n"
    },
    "solution": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst n = t[0];\nconst nums = t.slice(1, 1 + n);\nconst target = t[1 + n];\nlet lo = 0, hi = n - 1, ans = -1;\nwhile (lo <= hi) {\n  const mid = (lo + hi) >> 1;\n  if (nums[mid] === target) { ans = mid; break; }\n  if (nums[lo] <= nums[mid]) {\n    if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;\n  } else {\n    if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;\n  }\n}\nconsole.log(ans);\n"
    },
    "tests": [
      {
        "stdin": "7\n4 5 6 7 0 1 2\n0",
        "expected": "4"
      },
      {
        "stdin": "7\n4 5 6 7 0 1 2\n3",
        "expected": "-1"
      },
      {
        "stdin": "1\n1\n0",
        "expected": "-1"
      },
      {
        "stdin": "1\n1\n1",
        "expected": "0"
      },
      {
        "stdin": "3\n5 1 3\n5",
        "expected": "0"
      }
    ]
  },
  {
    "id": "find-minimum-in-rotated-sorted-array",
    "title": "Find Minimum in Rotated Sorted Array",
    "difficulty": "Medium",
    "tags": [
      "array",
      "binary-search"
    ],
    "statement": "<p>An ascending sorted array of <strong>distinct</strong> integers has been rotated at an unknown pivot. Return the minimum element. Aim for O(log n).</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers (rotated sorted, distinct).<br><strong>Output:</strong> the minimum element.</p>",
    "boiler": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst n = t[0];\nconst nums = t.slice(1, 1 + n);\n// TODO: find and print the minimum element\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){\n  int n; cin >> n;\n  vector<int> nums(n);\n  for(int i=0;i<n;i++) cin >> nums[i];\n  // TODO: find and print the minimum element\n  return 0;\n}\n"
    },
    "solution": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst n = t[0];\nconst nums = t.slice(1, 1 + n);\nlet lo = 0, hi = n - 1;\nwhile (lo < hi) {\n  const mid = (lo + hi) >> 1;\n  if (nums[mid] > nums[hi]) lo = mid + 1; else hi = mid;\n}\nconsole.log(nums[lo]);\n"
    },
    "tests": [
      {
        "stdin": "5\n3 4 5 1 2",
        "expected": "1"
      },
      {
        "stdin": "7\n4 5 6 7 0 1 2",
        "expected": "0"
      },
      {
        "stdin": "4\n11 13 15 17",
        "expected": "11"
      },
      {
        "stdin": "1\n1",
        "expected": "1"
      },
      {
        "stdin": "2\n2 1",
        "expected": "1"
      }
    ]
  },
  {
    "id": "search-a-2d-matrix",
    "title": "Search a 2D Matrix",
    "difficulty": "Medium",
    "tags": [
      "matrix",
      "binary-search"
    ],
    "statement": "<p>You are given an <code>m x n</code> matrix where each row is sorted ascending and the first integer of each row is greater than the last integer of the previous row. Determine whether <code>target</code> is present.</p>",
    "io": "<p><strong>Input:</strong> <code>m n</code>, then <code>m*n</code> integers row-major, then <code>target</code>.<br><strong>Output:</strong> <code>true</code> or <code>false</code>.</p>",
    "boiler": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst m = t[0], n = t[1];\nconst cells = t.slice(2, 2 + m * n);\nconst target = t[2 + m * n];\n// TODO: treat the matrix as one sorted list and search; print true or false\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){\n  int m, n; cin >> m >> n;\n  int total = m * n;\n  vector<int> cells(total);\n  for(int i=0;i<total;i++) cin >> cells[i];\n  int target; cin >> target;\n  // TODO: treat the matrix as one sorted list and search; print true or false\n  return 0;\n}\n"
    },
    "solution": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst m = t[0], n = t[1];\nconst cells = t.slice(2, 2 + m * n);\nconst target = t[2 + m * n];\nlet lo = 0, hi = m * n - 1, found = false;\nwhile (lo <= hi) {\n  const mid = (lo + hi) >> 1;\n  if (cells[mid] === target) { found = true; break; }\n  else if (cells[mid] < target) lo = mid + 1;\n  else hi = mid - 1;\n}\nconsole.log(found ? 'true' : 'false');\n"
    },
    "tests": [
      {
        "stdin": "3 4\n1 3 5 7 10 11 16 20 23 30 34 60\n3",
        "expected": "true"
      },
      {
        "stdin": "3 4\n1 3 5 7 10 11 16 20 23 30 34 60\n13",
        "expected": "false"
      },
      {
        "stdin": "1 1\n5\n5",
        "expected": "true"
      },
      {
        "stdin": "1 1\n5\n2",
        "expected": "false"
      }
    ]
  },
  {
    "id": "koko-eating-bananas",
    "title": "Koko Eating Bananas",
    "difficulty": "Medium",
    "tags": [
      "array",
      "binary-search"
    ],
    "statement": "<p>Koko has <code>n</code> piles of bananas and <code>h</code> hours before the guards return. Each hour she picks one pile and eats up to her speed <code>k</code> bananas from it (if the pile has fewer, she eats it and rests the remaining time that hour). Return the minimum integer speed <code>k</code> such that she can finish all the bananas within <code>h</code> hours.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers (piles), then <code>h</code>.<br><strong>Output:</strong> the minimum integer eating speed.</p>",
    "boiler": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst n = t[0];\nconst piles = t.slice(1, 1 + n);\nconst h = t[1 + n];\n// TODO: binary search the eating speed; print the minimum speed\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main(){\n  int n; cin >> n;\n  vector<long long> piles(n);\n  for(int i=0;i<n;i++) cin >> piles[i];\n  long long h; cin >> h;\n  // TODO: binary search the eating speed; print the minimum speed\n  return 0;\n}\n"
    },
    "solution": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst n = t[0];\nconst piles = t.slice(1, 1 + n);\nconst h = t[1 + n];\nlet lo = 1, hi = Math.max(...piles);\nwhile (lo < hi) {\n  const mid = (lo + hi) >> 1;\n  let hours = 0;\n  for (const p of piles) hours += Math.ceil(p / mid);\n  if (hours <= h) hi = mid; else lo = mid + 1;\n}\nconsole.log(lo);\n"
    },
    "tests": [
      {
        "stdin": "4\n3 6 7 11\n8",
        "expected": "4"
      },
      {
        "stdin": "5\n30 11 23 4 20\n5",
        "expected": "30"
      },
      {
        "stdin": "5\n30 11 23 4 20\n6",
        "expected": "23"
      },
      {
        "stdin": "4\n1 1 1 1\n4",
        "expected": "1"
      },
      {
        "stdin": "1\n312884470\n312884470",
        "expected": "1"
      }
    ]
  },
  {
    "id": "find-peak-element",
    "title": "Find Peak Element",
    "difficulty": "Medium",
    "tags": [
      "array",
      "binary-search"
    ],
    "statement": "<p>A peak element is strictly greater than its neighbors. Given an array, return the index of any peak. Positions past the ends are considered negative infinity, so a peak always exists. This binary-search solution returns a specific deterministic index for each input.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers.<br><strong>Output:</strong> the index of a peak (matches the reference binary-search choice).</p>",
    "boiler": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst n = t[0];\nconst nums = t.slice(1, 1 + n);\n// TODO: binary search toward the larger neighbor; print the peak index\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){\n  int n; cin >> n;\n  vector<int> nums(n);\n  for(int i=0;i<n;i++) cin >> nums[i];\n  // TODO: binary search toward the larger neighbor; print the peak index\n  return 0;\n}\n"
    },
    "solution": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst n = t[0];\nconst nums = t.slice(1, 1 + n);\nlet lo = 0, hi = n - 1;\nwhile (lo < hi) {\n  const mid = (lo + hi) >> 1;\n  if (nums[mid] > nums[mid + 1]) hi = mid; else lo = mid + 1;\n}\nconsole.log(lo);\n"
    },
    "tests": [
      {
        "stdin": "4\n1 2 3 1",
        "expected": "2"
      },
      {
        "stdin": "7\n1 2 1 3 5 6 4",
        "expected": "5"
      },
      {
        "stdin": "1\n1",
        "expected": "0"
      },
      {
        "stdin": "2\n1 2",
        "expected": "1"
      },
      {
        "stdin": "2\n2 1",
        "expected": "0"
      }
    ]
  },
  {
    "id": "kth-largest-element-in-an-array",
    "title": "Kth Largest Element in an Array",
    "difficulty": "Medium",
    "tags": [
      "array",
      "sorting",
      "heap"
    ],
    "statement": "<p>Given an integer array and an integer <code>k</code>, return the <code>k</code>-th largest element (in sorted order, not necessarily distinct).</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers, then <code>k</code>.<br><strong>Output:</strong> the k-th largest value.</p>",
    "boiler": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst n = t[0];\nconst nums = t.slice(1, 1 + n);\nconst k = t[1 + n];\n// TODO: print the k-th largest value\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main(){\n  int n; cin >> n;\n  vector<int> a(n);\n  for(int i=0;i<n;i++) cin >> a[i];\n  int k; cin >> k;\n  // TODO: print the k-th largest value\n  return 0;\n}\n"
    },
    "solution": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst n = t[0];\nconst nums = t.slice(1, 1 + n);\nconst k = t[1 + n];\nnums.sort((a, b) => b - a);\nconsole.log(nums[k - 1]);\n"
    },
    "tests": [
      {
        "stdin": "6\n3 2 1 5 6 4\n2",
        "expected": "5"
      },
      {
        "stdin": "9\n3 2 3 1 2 4 5 5 6\n4",
        "expected": "4"
      },
      {
        "stdin": "1\n1\n1",
        "expected": "1"
      },
      {
        "stdin": "2\n2 1\n2",
        "expected": "1"
      },
      {
        "stdin": "3\n7 7 7\n2",
        "expected": "7"
      }
    ]
  },
  {
    "id": "top-k-frequent-elements",
    "title": "Top K Frequent Elements",
    "difficulty": "Medium",
    "tags": [
      "array",
      "hashmap",
      "sorting"
    ],
    "statement": "<p>Given an integer array and an integer <code>k</code>, return the <code>k</code> most frequent elements. The answer is unique for the given inputs. Print the resulting values sorted in ascending order (canonical form).</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> integers, then <code>k</code>.<br><strong>Output:</strong> the k most frequent values, sorted ascending.</p>",
    "boiler": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst n = t[0];\nconst nums = t.slice(1, 1 + n);\nconst k = t[1 + n];\n// TODO: count frequencies, take the k most frequent, print them sorted ascending\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <unordered_map>\nusing namespace std;\nint main(){\n  int n; cin >> n;\n  vector<int> nums(n);\n  for(int i=0;i<n;i++) cin >> nums[i];\n  int k; cin >> k;\n  // TODO: count frequencies, take the k most frequent, print them sorted ascending\n  return 0;\n}\n"
    },
    "solution": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst n = t[0];\nconst nums = t.slice(1, 1 + n);\nconst k = t[1 + n];\nconst freq = new Map();\nfor (const x of nums) freq.set(x, (freq.get(x) || 0) + 1);\nconst arr = [...freq.entries()];\narr.sort((a, b) => b[1] - a[1]);\nconst top = arr.slice(0, k).map(e => e[0]);\ntop.sort((a, b) => a - b);\nconsole.log(top.join(' '));\n"
    },
    "tests": [
      {
        "stdin": "6\n1 1 1 2 2 3\n2",
        "expected": "1 2"
      },
      {
        "stdin": "6\n1 1 1 2 2 3\n1",
        "expected": "1"
      },
      {
        "stdin": "1\n7\n1",
        "expected": "7"
      },
      {
        "stdin": "9\n4 4 4 5 5 6 6 6 6\n2",
        "expected": "4 6"
      },
      {
        "stdin": "3\n10 10 20\n2",
        "expected": "10 20"
      }
    ]
  },
  {
    "id": "spiral-matrix",
    "title": "Spiral Matrix",
    "difficulty": "Medium",
    "tags": [
      "matrix",
      "simulation"
    ],
    "statement": "<p>Given an <code>m x n</code> matrix, return all of its elements in spiral order (clockwise, starting from the top-left).</p>",
    "io": "<p><strong>Input:</strong> <code>m n</code>, then <code>m*n</code> integers row-major.<br><strong>Output:</strong> the elements in spiral order.</p>",
    "boiler": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst m = t[0], n = t[1];\nconst g = [];\nlet idx = 2;\nfor (let i = 0; i < m; i++) { const row = []; for (let j = 0; j < n; j++) row.push(t[idx++]); g.push(row); }\n// TODO: traverse g in spiral order and print the values\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){\n  int m, n; cin >> m >> n;\n  vector<vector<int>> g(m, vector<int>(n));\n  for(int i=0;i<m;i++) for(int j=0;j<n;j++) cin >> g[i][j];\n  // TODO: traverse g in spiral order and print the values\n  return 0;\n}\n"
    },
    "solution": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst m = t[0], n = t[1];\nconst g = [];\nlet idx = 2;\nfor (let i = 0; i < m; i++) { const row = []; for (let j = 0; j < n; j++) row.push(t[idx++]); g.push(row); }\nconst res = [];\nlet top = 0, bottom = m - 1, left = 0, right = n - 1;\nwhile (top <= bottom && left <= right) {\n  for (let j = left; j <= right; j++) res.push(g[top][j]);\n  top++;\n  for (let i = top; i <= bottom; i++) res.push(g[i][right]);\n  right--;\n  if (top <= bottom) { for (let j = right; j >= left; j--) res.push(g[bottom][j]); bottom--; }\n  if (left <= right) { for (let i = bottom; i >= top; i--) res.push(g[i][left]); left++; }\n}\nconsole.log(res.join(' '));\n"
    },
    "tests": [
      {
        "stdin": "3 3\n1 2 3 4 5 6 7 8 9",
        "expected": "1 2 3 6 9 8 7 4 5"
      },
      {
        "stdin": "3 4\n1 2 3 4 5 6 7 8 9 10 11 12",
        "expected": "1 2 3 4 8 12 11 10 9 5 6 7"
      },
      {
        "stdin": "1 1\n5",
        "expected": "5"
      },
      {
        "stdin": "1 4\n1 2 3 4",
        "expected": "1 2 3 4"
      },
      {
        "stdin": "4 1\n1 2 3 4",
        "expected": "1 2 3 4"
      }
    ]
  },
  {
    "id": "rotate-image",
    "title": "Rotate Image",
    "difficulty": "Medium",
    "tags": [
      "matrix",
      "simulation"
    ],
    "statement": "<p>Given an <code>n x n</code> matrix, rotate it 90 degrees clockwise and output the resulting matrix.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n*n</code> integers row-major.<br><strong>Output:</strong> the rotated matrix, printed row-major.</p>",
    "boiler": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst n = t[0];\nconst g = [];\nlet idx = 1;\nfor (let i = 0; i < n; i++) { const row = []; for (let j = 0; j < n; j++) row.push(t[idx++]); g.push(row); }\n// TODO: rotate g 90 degrees clockwise and print it row-major\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){\n  int n; cin >> n;\n  vector<vector<int>> g(n, vector<int>(n));\n  for(int i=0;i<n;i++) for(int j=0;j<n;j++) cin >> g[i][j];\n  // TODO: rotate g 90 degrees clockwise and print it row-major\n  return 0;\n}\n"
    },
    "solution": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst n = t[0];\nconst g = [];\nlet idx = 1;\nfor (let i = 0; i < n; i++) { const row = []; for (let j = 0; j < n; j++) row.push(t[idx++]); g.push(row); }\nconst res = [];\nfor (let j = 0; j < n; j++) for (let i = n - 1; i >= 0; i--) res.push(g[i][j]);\nconsole.log(res.join(' '));\n"
    },
    "tests": [
      {
        "stdin": "2\n1 2 3 4",
        "expected": "3 1 4 2"
      },
      {
        "stdin": "3\n1 2 3 4 5 6 7 8 9",
        "expected": "7 4 1 8 5 2 9 6 3"
      },
      {
        "stdin": "1\n5",
        "expected": "5"
      }
    ]
  },
  {
    "id": "set-matrix-zeroes",
    "title": "Set Matrix Zeroes",
    "difficulty": "Medium",
    "tags": [
      "matrix",
      "simulation"
    ],
    "statement": "<p>Given an <code>m x n</code> matrix, if an element is 0, set its entire row and column to 0. Output the resulting matrix.</p>",
    "io": "<p><strong>Input:</strong> <code>m n</code>, then <code>m*n</code> integers row-major.<br><strong>Output:</strong> the matrix after zeroing, printed row-major.</p>",
    "boiler": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst m = t[0], n = t[1];\nconst g = [];\nlet idx = 2;\nfor (let i = 0; i < m; i++) { const row = []; for (let j = 0; j < n; j++) row.push(t[idx++]); g.push(row); }\n// TODO: zero each row and column that contains a 0; print the matrix row-major\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <unordered_set>\nusing namespace std;\nint main(){\n  int m, n; cin >> m >> n;\n  vector<vector<int>> g(m, vector<int>(n));\n  for(int i=0;i<m;i++) for(int j=0;j<n;j++) cin >> g[i][j];\n  // TODO: zero each row and column that contains a 0; print the matrix row-major\n  return 0;\n}\n"
    },
    "solution": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst m = t[0], n = t[1];\nconst g = [];\nlet idx = 2;\nfor (let i = 0; i < m; i++) { const row = []; for (let j = 0; j < n; j++) row.push(t[idx++]); g.push(row); }\nconst rows = new Set(), cols = new Set();\nfor (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (g[i][j] === 0) { rows.add(i); cols.add(j); }\nfor (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (rows.has(i) || cols.has(j)) g[i][j] = 0;\nconst res = [];\nfor (let i = 0; i < m; i++) for (let j = 0; j < n; j++) res.push(g[i][j]);\nconsole.log(res.join(' '));\n"
    },
    "tests": [
      {
        "stdin": "3 3\n1 1 1 1 0 1 1 1 1",
        "expected": "1 0 1 0 0 0 1 0 1"
      },
      {
        "stdin": "2 2\n1 2 3 4",
        "expected": "1 2 3 4"
      },
      {
        "stdin": "1 3\n1 0 3",
        "expected": "0 0 0"
      },
      {
        "stdin": "3 4\n0 1 2 0 3 4 5 2 1 3 1 5",
        "expected": "0 0 0 0 0 4 5 0 0 3 1 0"
      }
    ]
  },
  {
    "id": "powx-n",
    "title": "Pow(x, n)",
    "difficulty": "Medium",
    "tags": [
      "math"
    ],
    "statement": "<p>Given an integer base <code>x</code> and a non-negative integer exponent <code>n</code>, compute <code>x</code> raised to the power <code>n</code>. The exponent is small enough that the result fits in a signed 64-bit integer.</p>",
    "io": "<p><strong>Input:</strong> integer <code>x</code>, then integer <code>n</code> (n &ge; 0).<br><strong>Output:</strong> <code>x^n</code> as an integer.</p>",
    "boiler": {
      "js": "const t = input.split(/\\s+/).filter(Boolean);\nconst x = BigInt(t[0]);\nconst n = BigInt(t[1]);\n// TODO: compute x^n and print it as an integer\n",
      "cpp": "#include <iostream>\nusing namespace std;\nint main(){\n  long long x; int n;\n  cin >> x >> n;\n  // TODO: compute x^n and print it as an integer\n  return 0;\n}\n"
    },
    "solution": {
      "js": "const t = input.split(/\\s+/).filter(Boolean);\nconst x = BigInt(t[0]);\nconst n = BigInt(t[1]);\nlet res = 1n;\nfor (let i = 0n; i < n; i++) res *= x;\nconsole.log(res.toString());\n"
    },
    "tests": [
      {
        "stdin": "2\n10",
        "expected": "1024"
      },
      {
        "stdin": "3\n0",
        "expected": "1"
      },
      {
        "stdin": "2\n0",
        "expected": "1"
      },
      {
        "stdin": "5\n3",
        "expected": "125"
      },
      {
        "stdin": "-2\n3",
        "expected": "-8"
      }
    ]
  },
  {
    "id": "happy-number",
    "title": "Happy Number",
    "difficulty": "Easy",
    "tags": [
      "math",
      "hashset"
    ],
    "statement": "<p>A number is happy if repeatedly replacing it by the sum of the squares of its digits eventually reaches 1. If the process loops endlessly without reaching 1, the number is not happy. Determine whether <code>n</code> is a happy number.</p>",
    "io": "<p><strong>Input:</strong> integer <code>n</code>.<br><strong>Output:</strong> <code>true</code> or <code>false</code>.</p>",
    "boiler": {
      "js": "const n = Number(input.trim());\n// TODO: iterate sum-of-squares of digits, detect a cycle; print true or false\n",
      "cpp": "#include <iostream>\n#include <unordered_set>\nusing namespace std;\nint main(){\n  int n; cin >> n;\n  // TODO: iterate sum-of-squares of digits, detect a cycle; print true or false\n  return 0;\n}\n"
    },
    "solution": {
      "js": "const n = Number(input.trim());\nlet x = n;\nconst seen = new Set();\nwhile (x !== 1 && !seen.has(x)) {\n  seen.add(x);\n  let s = 0;\n  while (x > 0) { const d = x % 10; s += d * d; x = Math.floor(x / 10); }\n  x = s;\n}\nconsole.log(x === 1 ? 'true' : 'false');\n"
    },
    "tests": [
      {
        "stdin": "19",
        "expected": "true"
      },
      {
        "stdin": "2",
        "expected": "false"
      },
      {
        "stdin": "1",
        "expected": "true"
      },
      {
        "stdin": "7",
        "expected": "true"
      },
      {
        "stdin": "4",
        "expected": "false"
      }
    ]
  },
  {
    "id": "count-primes",
    "title": "Count Primes",
    "difficulty": "Medium",
    "tags": [
      "math",
      "sieve"
    ],
    "statement": "<p>Given an integer <code>n</code>, count the number of prime numbers strictly less than <code>n</code>.</p>",
    "io": "<p><strong>Input:</strong> integer <code>n</code>.<br><strong>Output:</strong> the count of primes strictly less than <code>n</code>.</p>",
    "boiler": {
      "js": "const n = Number(input.trim());\n// TODO: use a sieve to count primes strictly less than n; print the count\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){\n  int n; cin >> n;\n  // TODO: use a sieve to count primes strictly less than n; print the count\n  return 0;\n}\n"
    },
    "solution": {
      "js": "const n = Number(input.trim());\nif (n < 3) {\n  console.log(0);\n} else {\n  const sieve = new Array(n).fill(true);\n  sieve[0] = false; sieve[1] = false;\n  for (let i = 2; i * i < n; i++) {\n    if (sieve[i]) { for (let j = i * i; j < n; j += i) sieve[j] = false; }\n  }\n  let c = 0;\n  for (let i = 2; i < n; i++) if (sieve[i]) c++;\n  console.log(c);\n}\n"
    },
    "tests": [
      {
        "stdin": "10",
        "expected": "4"
      },
      {
        "stdin": "0",
        "expected": "0"
      },
      {
        "stdin": "2",
        "expected": "0"
      },
      {
        "stdin": "100",
        "expected": "25"
      },
      {
        "stdin": "3",
        "expected": "1"
      }
    ]
  },
  {
    "id": "plus-one",
    "title": "Plus One",
    "difficulty": "Easy",
    "tags": [
      "array",
      "math"
    ],
    "statement": "<p>A non-negative integer is represented as an array of digits, most-significant digit first, with no leading zeros (except the value 0 itself). Add one to the number and return the resulting digits.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> digits (0-9, most-significant first).<br><strong>Output:</strong> the digits of (number + 1).</p>",
    "boiler": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst n = t[0];\nconst d = t.slice(1, 1 + n);\n// TODO: add one with carry; print the resulting digits\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main(){\n  int n; cin >> n;\n  vector<int> d(n);\n  for(int i=0;i<n;i++) cin >> d[i];\n  // TODO: add one with carry; print the resulting digits\n  return 0;\n}\n"
    },
    "solution": {
      "js": "const t = input.split(/\\s+/).filter(Boolean).map(Number);\nconst n = t[0];\nconst d = t.slice(1, 1 + n);\nlet carry = 1;\nfor (let i = n - 1; i >= 0; i--) { const s = d[i] + carry; d[i] = s % 10; carry = Math.floor(s / 10); }\nif (carry) d.unshift(carry);\nconsole.log(d.join(' '));\n"
    },
    "tests": [
      {
        "stdin": "3\n1 2 3",
        "expected": "1 2 4"
      },
      {
        "stdin": "1\n9",
        "expected": "1 0"
      },
      {
        "stdin": "2\n9 9",
        "expected": "1 0 0"
      },
      {
        "stdin": "2\n1 0",
        "expected": "1 1"
      },
      {
        "stdin": "4\n4 3 2 1",
        "expected": "4 3 2 2"
      }
    ]
  },
  {
    "id": "add-binary",
    "title": "Add Binary",
    "difficulty": "Easy",
    "tags": [
      "string",
      "math",
      "bit-manipulation"
    ],
    "statement": "<p>Given two binary strings <code>a</code> and <code>b</code>, return their sum as a binary string. The result must have no leading zeros (except the single digit 0).</p>",
    "io": "<p><strong>Input:</strong> two binary string tokens <code>a</code> and <code>b</code>.<br><strong>Output:</strong> their sum as a binary string token.</p>",
    "boiler": {
      "js": "const t = input.split(/\\s+/).filter(Boolean);\nconst a = t[0], b = t[1];\n// TODO: add the two binary strings; print the binary sum\n",
      "cpp": "#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\nint main(){\n  string a, b; cin >> a >> b;\n  // TODO: add the two binary strings; print the binary sum\n  return 0;\n}\n"
    },
    "solution": {
      "js": "const t = input.split(/\\s+/).filter(Boolean);\nconst a = t[0], b = t[1];\nconst sum = (BigInt('0b' + a) + BigInt('0b' + b)).toString(2);\nconsole.log(sum);\n"
    },
    "tests": [
      {
        "stdin": "11 1",
        "expected": "100"
      },
      {
        "stdin": "1010 1011",
        "expected": "10101"
      },
      {
        "stdin": "0 0",
        "expected": "0"
      },
      {
        "stdin": "1 1",
        "expected": "10"
      },
      {
        "stdin": "0 1",
        "expected": "1"
      }
    ]
  },
  {
    "id": "reverse-linked-list",
    "title": "Reverse Linked List",
    "difficulty": "Easy",
    "tags": [
      "Linked List",
      "Two Pointers"
    ],
    "statement": "<p>Given the head of a singly linked list, reverse the list and return the reversed values.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> node values.<br><strong>Output:</strong> the values in reverse order (nothing if the list is empty).</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst list = d.slice(p, p + n); p += n;\n\n// TODO\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> list(n);\n    for (int i = 0; i < n; i++) cin >> list[i];\n\n    // TODO\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst list = d.slice(p, p + n); p += n;\nif(n) console.log(list.slice().reverse().join(' '));"
    },
    "tests": [
      {
        "stdin": "5\n1 2 3 4 5",
        "expected": "5 4 3 2 1"
      },
      {
        "stdin": "2\n1 2",
        "expected": "2 1"
      },
      {
        "stdin": "1\n7",
        "expected": "7"
      },
      {
        "stdin": "0",
        "expected": ""
      }
    ]
  },
  {
    "id": "middle-of-the-linked-list",
    "title": "Middle of the Linked List",
    "difficulty": "Easy",
    "tags": [
      "Linked List",
      "Two Pointers"
    ],
    "statement": "<p>Given the head of a singly linked list, return the values from the middle node to the end. If there are two middle nodes, return the values starting from the <strong>second</strong> middle node.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> node values.<br><strong>Output:</strong> the values from the middle node to the end.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst list = d.slice(p, p + n); p += n;\n\n// TODO\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> list(n);\n    for (int i = 0; i < n; i++) cin >> list[i];\n\n    // TODO\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst list = d.slice(p, p + n); p += n;\nconsole.log(list.slice(Math.floor(n/2)).join(' '));"
    },
    "tests": [
      {
        "stdin": "5\n1 2 3 4 5",
        "expected": "3 4 5"
      },
      {
        "stdin": "6\n1 2 3 4 5 6",
        "expected": "4 5 6"
      },
      {
        "stdin": "2\n1 2",
        "expected": "2"
      },
      {
        "stdin": "1\n1",
        "expected": "1"
      }
    ]
  },
  {
    "id": "merge-two-sorted-lists",
    "title": "Merge Two Sorted Lists",
    "difficulty": "Easy",
    "tags": [
      "Linked List",
      "Two Pointers"
    ],
    "statement": "<p>Given the heads of two sorted linked lists, merge them into one sorted list and return its values.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> sorted values, then <code>m</code>, then <code>m</code> sorted values.<br><strong>Output:</strong> the merged values in sorted order.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst a = d.slice(p, p + n); p += n;\nconst m = d[p++];\nconst b = d.slice(p, p + m); p += m;\n\n// TODO\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) cin >> a[i];\n    int m; cin >> m;\n    vector<int> b(m);\n    for (int i = 0; i < m; i++) cin >> b[i];\n\n    // TODO\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst a = d.slice(p, p + n); p += n;\nconst m = d[p++];\nconst b = d.slice(p, p + m); p += m;\nlet i=0,j=0;const res=[];\nwhile(i<n&&j<m){ if(a[i]<=b[j]) res.push(a[i++]); else res.push(b[j++]); }\nwhile(i<n) res.push(a[i++]);\nwhile(j<m) res.push(b[j++]);\nif(res.length) console.log(res.join(' '));"
    },
    "tests": [
      {
        "stdin": "3\n1 2 4\n3\n1 3 4",
        "expected": "1 1 2 3 4 4"
      },
      {
        "stdin": "3\n1 2 3\n2\n4 5",
        "expected": "1 2 3 4 5"
      },
      {
        "stdin": "1\n5\n0",
        "expected": "5"
      },
      {
        "stdin": "0\n0",
        "expected": ""
      }
    ]
  },
  {
    "id": "remove-nth-node-from-end-of-list",
    "title": "Remove Nth Node From End of List",
    "difficulty": "Medium",
    "tags": [
      "Linked List",
      "Two Pointers"
    ],
    "statement": "<p>Given the head of a linked list, remove the <code>k</code>-th node from the end of the list and return the remaining values.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> node values, then <code>k</code>.<br><strong>Output:</strong> the values after removing the <code>k</code>-th node from the end (nothing if the list becomes empty).</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst list = d.slice(p, p + n); p += n;\nconst kk = d[p++];\n\n// TODO\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> list(n);\n    for (int i = 0; i < n; i++) cin >> list[i];\n    int k; cin >> k;\n\n    // TODO\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst list = d.slice(p, p + n); p += n;\nconst kk = d[p++];\nconst idx = n - kk;\nconst res = list.slice(0, idx).concat(list.slice(idx + 1));\nif(res.length) console.log(res.join(' '));"
    },
    "tests": [
      {
        "stdin": "5\n1 2 3 4 5\n2",
        "expected": "1 2 3 5"
      },
      {
        "stdin": "5\n1 2 3 4 5\n5",
        "expected": "2 3 4 5"
      },
      {
        "stdin": "2\n1 2\n1",
        "expected": "1"
      },
      {
        "stdin": "1\n1\n1",
        "expected": ""
      }
    ]
  },
  {
    "id": "palindrome-linked-list",
    "title": "Palindrome Linked List",
    "difficulty": "Easy",
    "tags": [
      "Linked List",
      "Two Pointers"
    ],
    "statement": "<p>Given the head of a singly linked list, return <code>true</code> if the list is a palindrome, otherwise <code>false</code>.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> node values.<br><strong>Output:</strong> <code>true</code> or <code>false</code>.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst list = d.slice(p, p + n); p += n;\n\n// TODO\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> list(n);\n    for (int i = 0; i < n; i++) cin >> list[i];\n\n    // TODO\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst list = d.slice(p, p + n); p += n;\nlet ok=true;\nfor(let i=0,j=n-1;i<j;i++,j--){ if(list[i]!==list[j]){ ok=false; break; } }\nconsole.log(ok ? 'true' : 'false');"
    },
    "tests": [
      {
        "stdin": "3\n1 2 1",
        "expected": "true"
      },
      {
        "stdin": "4\n1 2 2 1",
        "expected": "true"
      },
      {
        "stdin": "2\n1 2",
        "expected": "false"
      },
      {
        "stdin": "1\n1",
        "expected": "true"
      }
    ]
  },
  {
    "id": "add-two-numbers",
    "title": "Add Two Numbers",
    "difficulty": "Medium",
    "tags": [
      "Linked List",
      "Math"
    ],
    "statement": "<p>You are given two non-negative integers represented as linked lists, where each node holds a single digit and the digits are stored in <strong>reverse</strong> order (least-significant digit first). Add the two numbers and return the sum as a list of digits in the same reverse order.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> digits of A (least-significant first), then <code>m</code>, then <code>m</code> digits of B.<br><strong>Output:</strong> the digits of A+B, least-significant first.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst A = d.slice(p, p + n); p += n;\nconst m = d[p++];\nconst B = d.slice(p, p + m); p += m;\n\n// TODO\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> A(n);\n    for (int i = 0; i < n; i++) cin >> A[i];\n    int m; cin >> m;\n    vector<int> B(m);\n    for (int i = 0; i < m; i++) cin >> B[i];\n\n    // TODO\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst A = d.slice(p, p + n); p += n;\nconst m = d[p++];\nconst B = d.slice(p, p + m); p += m;\nlet carry=0,i=0;const res=[];\nwhile(i<A.length || i<B.length || carry){ const s=(A[i]||0)+(B[i]||0)+carry; res.push(s%10); carry=Math.floor(s/10); i++; }\nconsole.log(res.join(' '));"
    },
    "tests": [
      {
        "stdin": "3\n2 4 3\n3\n5 6 4",
        "expected": "7 0 8"
      },
      {
        "stdin": "1\n0\n1\n0",
        "expected": "0"
      },
      {
        "stdin": "2\n9 9\n1\n1",
        "expected": "0 0 1"
      },
      {
        "stdin": "1\n5\n1\n5",
        "expected": "0 1"
      }
    ]
  },
  {
    "id": "maximum-depth-of-binary-tree",
    "title": "Maximum Depth of Binary Tree",
    "difficulty": "Easy",
    "tags": [
      "Tree",
      "DFS",
      "BFS"
    ],
    "statement": "<p>Given the root of a binary tree, return its maximum depth: the number of nodes along the longest path from the root down to the farthest leaf.</p>",
    "io": "<p><strong>Input:</strong> <code>k</code>, then <code>k</code> level-order tokens (each an integer or <code>null</code>).<br><strong>Output:</strong> the maximum depth.</p>",
    "boiler": {
      "js": "const toks = input.trim().length ? input.trim().split(/\\s+/) : [];\nlet p = 0;\nfunction buildTree(vals){\n  if(vals.length===0 || vals[0]==='null') return null;\n  const root={val:Number(vals[0]),left:null,right:null};\n  const q=[root]; let i=1;\n  while(q.length && i<vals.length){\n    const node=q.shift();\n    if(i<vals.length){const l=vals[i++]; if(l!=='null'){node.left={val:Number(l),left:null,right:null}; q.push(node.left);}}\n    if(i<vals.length){const r=vals[i++]; if(r!=='null'){node.right={val:Number(r),left:null,right:null}; q.push(node.right);}}\n  }\n  return root;\n}\nconst k = Number(toks[p++]);\nconst vals = toks.slice(p, p + k); p += k;\nconst root = buildTree(vals);\n\n// TODO\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <queue>\nusing namespace std;\n\nstruct Node { int val; Node* left; Node* right; Node(int v):val(v),left(nullptr),right(nullptr){} };\n\nNode* buildTree(const vector<string>& vals){\n    if(vals.empty() || vals[0]==\"null\") return nullptr;\n    Node* root = new Node(stoi(vals[0]));\n    queue<Node*> q; q.push(root); size_t i = 1;\n    while(!q.empty() && i < vals.size()){\n        Node* node = q.front(); q.pop();\n        if(i < vals.size()){ string l = vals[i++]; if(l!=\"null\"){ node->left = new Node(stoi(l)); q.push(node->left); } }\n        if(i < vals.size()){ string r = vals[i++]; if(r!=\"null\"){ node->right = new Node(stoi(r)); q.push(node->right); } }\n    }\n    return root;\n}\n\nint main() {\n    int k; cin >> k;\n    vector<string> vals(k);\n    for (int i = 0; i < k; i++) cin >> vals[i];\n    Node* root = buildTree(vals);\n\n    // TODO\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const toks = input.trim().length ? input.trim().split(/\\s+/) : [];\nlet p = 0;\nfunction buildTree(vals){\n  if(vals.length===0 || vals[0]==='null') return null;\n  const root={val:Number(vals[0]),left:null,right:null};\n  const q=[root]; let i=1;\n  while(q.length && i<vals.length){\n    const node=q.shift();\n    if(i<vals.length){const l=vals[i++]; if(l!=='null'){node.left={val:Number(l),left:null,right:null}; q.push(node.left);}}\n    if(i<vals.length){const r=vals[i++]; if(r!=='null'){node.right={val:Number(r),left:null,right:null}; q.push(node.right);}}\n  }\n  return root;\n}\nconst k = Number(toks[p++]);\nconst vals = toks.slice(p, p + k); p += k;\nconst root = buildTree(vals);\nfunction depth(node){ return node ? 1 + Math.max(depth(node.left), depth(node.right)) : 0; }\nconsole.log(depth(root));"
    },
    "tests": [
      {
        "stdin": "7\n3 9 20 null null 15 7",
        "expected": "3"
      },
      {
        "stdin": "3\n1 null 2",
        "expected": "2"
      },
      {
        "stdin": "1\n1",
        "expected": "1"
      },
      {
        "stdin": "0",
        "expected": "0"
      }
    ]
  },
  {
    "id": "same-tree",
    "title": "Same Tree",
    "difficulty": "Easy",
    "tags": [
      "Tree",
      "DFS"
    ],
    "statement": "<p>Given the roots of two binary trees, return <code>true</code> if they are structurally identical and every corresponding node has the same value, otherwise <code>false</code>.</p>",
    "io": "<p><strong>Input:</strong> the first tree (<code>k1</code> then <code>k1</code> tokens), then the second tree (<code>k2</code> then <code>k2</code> tokens).<br><strong>Output:</strong> <code>true</code> or <code>false</code>.</p>",
    "boiler": {
      "js": "const toks = input.trim().length ? input.trim().split(/\\s+/) : [];\nlet p = 0;\nfunction buildTree(vals){\n  if(vals.length===0 || vals[0]==='null') return null;\n  const root={val:Number(vals[0]),left:null,right:null};\n  const q=[root]; let i=1;\n  while(q.length && i<vals.length){\n    const node=q.shift();\n    if(i<vals.length){const l=vals[i++]; if(l!=='null'){node.left={val:Number(l),left:null,right:null}; q.push(node.left);}}\n    if(i<vals.length){const r=vals[i++]; if(r!=='null'){node.right={val:Number(r),left:null,right:null}; q.push(node.right);}}\n  }\n  return root;\n}\nconst k1 = Number(toks[p++]);\nconst vals1 = toks.slice(p, p + k1); p += k1;\nconst t1 = buildTree(vals1);\nconst k2 = Number(toks[p++]);\nconst vals2 = toks.slice(p, p + k2); p += k2;\nconst t2 = buildTree(vals2);\n\n// TODO\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <queue>\nusing namespace std;\n\nstruct Node { int val; Node* left; Node* right; Node(int v):val(v),left(nullptr),right(nullptr){} };\n\nNode* buildTree(const vector<string>& vals){\n    if(vals.empty() || vals[0]==\"null\") return nullptr;\n    Node* root = new Node(stoi(vals[0]));\n    queue<Node*> q; q.push(root); size_t i = 1;\n    while(!q.empty() && i < vals.size()){\n        Node* node = q.front(); q.pop();\n        if(i < vals.size()){ string l = vals[i++]; if(l!=\"null\"){ node->left = new Node(stoi(l)); q.push(node->left); } }\n        if(i < vals.size()){ string r = vals[i++]; if(r!=\"null\"){ node->right = new Node(stoi(r)); q.push(node->right); } }\n    }\n    return root;\n}\n\nint main() {\n    int k1; cin >> k1;\n    vector<string> v1(k1);\n    for (int i = 0; i < k1; i++) cin >> v1[i];\n    Node* t1 = buildTree(v1);\n    int k2; cin >> k2;\n    vector<string> v2(k2);\n    for (int i = 0; i < k2; i++) cin >> v2[i];\n    Node* t2 = buildTree(v2);\n\n    // TODO\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const toks = input.trim().length ? input.trim().split(/\\s+/) : [];\nlet p = 0;\nfunction buildTree(vals){\n  if(vals.length===0 || vals[0]==='null') return null;\n  const root={val:Number(vals[0]),left:null,right:null};\n  const q=[root]; let i=1;\n  while(q.length && i<vals.length){\n    const node=q.shift();\n    if(i<vals.length){const l=vals[i++]; if(l!=='null'){node.left={val:Number(l),left:null,right:null}; q.push(node.left);}}\n    if(i<vals.length){const r=vals[i++]; if(r!=='null'){node.right={val:Number(r),left:null,right:null}; q.push(node.right);}}\n  }\n  return root;\n}\nconst k1 = Number(toks[p++]);\nconst vals1 = toks.slice(p, p + k1); p += k1;\nconst t1 = buildTree(vals1);\nconst k2 = Number(toks[p++]);\nconst vals2 = toks.slice(p, p + k2); p += k2;\nconst t2 = buildTree(vals2);\nfunction same(a,b){ if(!a&&!b) return true; if(!a||!b||a.val!==b.val) return false; return same(a.left,b.left)&&same(a.right,b.right); }\nconsole.log(same(t1,t2) ? 'true' : 'false');"
    },
    "tests": [
      {
        "stdin": "3\n1 2 3\n3\n1 2 3",
        "expected": "true"
      },
      {
        "stdin": "2\n1 2\n3\n1 null 2",
        "expected": "false"
      },
      {
        "stdin": "3\n1 2 1\n3\n1 1 2",
        "expected": "false"
      },
      {
        "stdin": "0\n0",
        "expected": "true"
      }
    ]
  },
  {
    "id": "invert-binary-tree",
    "title": "Invert Binary Tree",
    "difficulty": "Easy",
    "tags": [
      "Tree",
      "DFS",
      "BFS"
    ],
    "statement": "<p>Given the root of a binary tree, invert it (swap the left and right child of every node) and return the resulting tree.</p>",
    "io": "<p><strong>Input:</strong> <code>k</code>, then <code>k</code> level-order tokens.<br><strong>Output:</strong> the inverted tree as level-order integers with trailing <code>null</code>s trimmed.</p>",
    "boiler": {
      "js": "const toks = input.trim().length ? input.trim().split(/\\s+/) : [];\nlet p = 0;\nfunction buildTree(vals){\n  if(vals.length===0 || vals[0]==='null') return null;\n  const root={val:Number(vals[0]),left:null,right:null};\n  const q=[root]; let i=1;\n  while(q.length && i<vals.length){\n    const node=q.shift();\n    if(i<vals.length){const l=vals[i++]; if(l!=='null'){node.left={val:Number(l),left:null,right:null}; q.push(node.left);}}\n    if(i<vals.length){const r=vals[i++]; if(r!=='null'){node.right={val:Number(r),left:null,right:null}; q.push(node.right);}}\n  }\n  return root;\n}\nconst k = Number(toks[p++]);\nconst vals = toks.slice(p, p + k); p += k;\nconst root = buildTree(vals);\nfunction serialize(root){\n  if(!root) return '';\n  const out=[]; const q=[root];\n  while(q.length){\n    const node=q.shift();\n    if(node){ out.push(String(node.val)); q.push(node.left); q.push(node.right); }\n    else out.push('null');\n  }\n  while(out.length && out[out.length-1]==='null') out.pop();\n  return out.join(' ');\n}\n\n// TODO\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <queue>\nusing namespace std;\n\nstruct Node { int val; Node* left; Node* right; Node(int v):val(v),left(nullptr),right(nullptr){} };\n\nNode* buildTree(const vector<string>& vals){\n    if(vals.empty() || vals[0]==\"null\") return nullptr;\n    Node* root = new Node(stoi(vals[0]));\n    queue<Node*> q; q.push(root); size_t i = 1;\n    while(!q.empty() && i < vals.size()){\n        Node* node = q.front(); q.pop();\n        if(i < vals.size()){ string l = vals[i++]; if(l!=\"null\"){ node->left = new Node(stoi(l)); q.push(node->left); } }\n        if(i < vals.size()){ string r = vals[i++]; if(r!=\"null\"){ node->right = new Node(stoi(r)); q.push(node->right); } }\n    }\n    return root;\n}\n\nint main() {\n    int k; cin >> k;\n    vector<string> vals(k);\n    for (int i = 0; i < k; i++) cin >> vals[i];\n    Node* root = buildTree(vals);\n\n    // TODO\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const toks = input.trim().length ? input.trim().split(/\\s+/) : [];\nlet p = 0;\nfunction buildTree(vals){\n  if(vals.length===0 || vals[0]==='null') return null;\n  const root={val:Number(vals[0]),left:null,right:null};\n  const q=[root]; let i=1;\n  while(q.length && i<vals.length){\n    const node=q.shift();\n    if(i<vals.length){const l=vals[i++]; if(l!=='null'){node.left={val:Number(l),left:null,right:null}; q.push(node.left);}}\n    if(i<vals.length){const r=vals[i++]; if(r!=='null'){node.right={val:Number(r),left:null,right:null}; q.push(node.right);}}\n  }\n  return root;\n}\nconst k = Number(toks[p++]);\nconst vals = toks.slice(p, p + k); p += k;\nconst root = buildTree(vals);\nfunction serialize(root){\n  if(!root) return '';\n  const out=[]; const q=[root];\n  while(q.length){\n    const node=q.shift();\n    if(node){ out.push(String(node.val)); q.push(node.left); q.push(node.right); }\n    else out.push('null');\n  }\n  while(out.length && out[out.length-1]==='null') out.pop();\n  return out.join(' ');\n}\nfunction invert(node){ if(!node) return; const t=node.left; node.left=node.right; node.right=t; invert(node.left); invert(node.right); }\ninvert(root);\nconst s=serialize(root); if(s) console.log(s);"
    },
    "tests": [
      {
        "stdin": "7\n4 2 7 1 3 6 9",
        "expected": "4 7 2 9 6 3 1"
      },
      {
        "stdin": "3\n2 1 3",
        "expected": "2 3 1"
      },
      {
        "stdin": "2\n1 2",
        "expected": "1 null 2"
      },
      {
        "stdin": "0",
        "expected": ""
      }
    ]
  },
  {
    "id": "diameter-of-binary-tree",
    "title": "Diameter of Binary Tree",
    "difficulty": "Easy",
    "tags": [
      "Tree",
      "DFS"
    ],
    "statement": "<p>Given the root of a binary tree, return the length of its diameter: the number of edges on the longest path between any two nodes. This path may or may not pass through the root.</p>",
    "io": "<p><strong>Input:</strong> <code>k</code>, then <code>k</code> level-order tokens.<br><strong>Output:</strong> the diameter measured in edges.</p>",
    "boiler": {
      "js": "const toks = input.trim().length ? input.trim().split(/\\s+/) : [];\nlet p = 0;\nfunction buildTree(vals){\n  if(vals.length===0 || vals[0]==='null') return null;\n  const root={val:Number(vals[0]),left:null,right:null};\n  const q=[root]; let i=1;\n  while(q.length && i<vals.length){\n    const node=q.shift();\n    if(i<vals.length){const l=vals[i++]; if(l!=='null'){node.left={val:Number(l),left:null,right:null}; q.push(node.left);}}\n    if(i<vals.length){const r=vals[i++]; if(r!=='null'){node.right={val:Number(r),left:null,right:null}; q.push(node.right);}}\n  }\n  return root;\n}\nconst k = Number(toks[p++]);\nconst vals = toks.slice(p, p + k); p += k;\nconst root = buildTree(vals);\n\n// TODO\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <queue>\nusing namespace std;\n\nstruct Node { int val; Node* left; Node* right; Node(int v):val(v),left(nullptr),right(nullptr){} };\n\nNode* buildTree(const vector<string>& vals){\n    if(vals.empty() || vals[0]==\"null\") return nullptr;\n    Node* root = new Node(stoi(vals[0]));\n    queue<Node*> q; q.push(root); size_t i = 1;\n    while(!q.empty() && i < vals.size()){\n        Node* node = q.front(); q.pop();\n        if(i < vals.size()){ string l = vals[i++]; if(l!=\"null\"){ node->left = new Node(stoi(l)); q.push(node->left); } }\n        if(i < vals.size()){ string r = vals[i++]; if(r!=\"null\"){ node->right = new Node(stoi(r)); q.push(node->right); } }\n    }\n    return root;\n}\n\nint main() {\n    int k; cin >> k;\n    vector<string> vals(k);\n    for (int i = 0; i < k; i++) cin >> vals[i];\n    Node* root = buildTree(vals);\n\n    // TODO\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const toks = input.trim().length ? input.trim().split(/\\s+/) : [];\nlet p = 0;\nfunction buildTree(vals){\n  if(vals.length===0 || vals[0]==='null') return null;\n  const root={val:Number(vals[0]),left:null,right:null};\n  const q=[root]; let i=1;\n  while(q.length && i<vals.length){\n    const node=q.shift();\n    if(i<vals.length){const l=vals[i++]; if(l!=='null'){node.left={val:Number(l),left:null,right:null}; q.push(node.left);}}\n    if(i<vals.length){const r=vals[i++]; if(r!=='null'){node.right={val:Number(r),left:null,right:null}; q.push(node.right);}}\n  }\n  return root;\n}\nconst k = Number(toks[p++]);\nconst vals = toks.slice(p, p + k); p += k;\nconst root = buildTree(vals);\nlet best=0;\nfunction h(node){ if(!node) return 0; const l=h(node.left), r=h(node.right); if(l+r>best) best=l+r; return 1+Math.max(l,r); }\nh(root);\nconsole.log(best);"
    },
    "tests": [
      {
        "stdin": "5\n1 2 3 4 5",
        "expected": "3"
      },
      {
        "stdin": "2\n1 2",
        "expected": "1"
      },
      {
        "stdin": "1\n1",
        "expected": "0"
      },
      {
        "stdin": "0",
        "expected": "0"
      }
    ]
  },
  {
    "id": "balanced-binary-tree",
    "title": "Balanced Binary Tree",
    "difficulty": "Easy",
    "tags": [
      "Tree",
      "DFS"
    ],
    "statement": "<p>Given the root of a binary tree, return <code>true</code> if it is height-balanced: for every node the heights of its two subtrees differ by at most one.</p>",
    "io": "<p><strong>Input:</strong> <code>k</code>, then <code>k</code> level-order tokens.<br><strong>Output:</strong> <code>true</code> or <code>false</code>.</p>",
    "boiler": {
      "js": "const toks = input.trim().length ? input.trim().split(/\\s+/) : [];\nlet p = 0;\nfunction buildTree(vals){\n  if(vals.length===0 || vals[0]==='null') return null;\n  const root={val:Number(vals[0]),left:null,right:null};\n  const q=[root]; let i=1;\n  while(q.length && i<vals.length){\n    const node=q.shift();\n    if(i<vals.length){const l=vals[i++]; if(l!=='null'){node.left={val:Number(l),left:null,right:null}; q.push(node.left);}}\n    if(i<vals.length){const r=vals[i++]; if(r!=='null'){node.right={val:Number(r),left:null,right:null}; q.push(node.right);}}\n  }\n  return root;\n}\nconst k = Number(toks[p++]);\nconst vals = toks.slice(p, p + k); p += k;\nconst root = buildTree(vals);\n\n// TODO\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <queue>\nusing namespace std;\n\nstruct Node { int val; Node* left; Node* right; Node(int v):val(v),left(nullptr),right(nullptr){} };\n\nNode* buildTree(const vector<string>& vals){\n    if(vals.empty() || vals[0]==\"null\") return nullptr;\n    Node* root = new Node(stoi(vals[0]));\n    queue<Node*> q; q.push(root); size_t i = 1;\n    while(!q.empty() && i < vals.size()){\n        Node* node = q.front(); q.pop();\n        if(i < vals.size()){ string l = vals[i++]; if(l!=\"null\"){ node->left = new Node(stoi(l)); q.push(node->left); } }\n        if(i < vals.size()){ string r = vals[i++]; if(r!=\"null\"){ node->right = new Node(stoi(r)); q.push(node->right); } }\n    }\n    return root;\n}\n\nint main() {\n    int k; cin >> k;\n    vector<string> vals(k);\n    for (int i = 0; i < k; i++) cin >> vals[i];\n    Node* root = buildTree(vals);\n\n    // TODO\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const toks = input.trim().length ? input.trim().split(/\\s+/) : [];\nlet p = 0;\nfunction buildTree(vals){\n  if(vals.length===0 || vals[0]==='null') return null;\n  const root={val:Number(vals[0]),left:null,right:null};\n  const q=[root]; let i=1;\n  while(q.length && i<vals.length){\n    const node=q.shift();\n    if(i<vals.length){const l=vals[i++]; if(l!=='null'){node.left={val:Number(l),left:null,right:null}; q.push(node.left);}}\n    if(i<vals.length){const r=vals[i++]; if(r!=='null'){node.right={val:Number(r),left:null,right:null}; q.push(node.right);}}\n  }\n  return root;\n}\nconst k = Number(toks[p++]);\nconst vals = toks.slice(p, p + k); p += k;\nconst root = buildTree(vals);\nlet ok=true;\nfunction h(node){ if(!node) return 0; const l=h(node.left), r=h(node.right); if(Math.abs(l-r)>1) ok=false; return 1+Math.max(l,r); }\nh(root);\nconsole.log(ok ? 'true' : 'false');"
    },
    "tests": [
      {
        "stdin": "7\n3 9 20 null null 15 7",
        "expected": "true"
      },
      {
        "stdin": "9\n1 2 2 3 3 null null 4 4",
        "expected": "false"
      },
      {
        "stdin": "3\n1 2 3",
        "expected": "true"
      },
      {
        "stdin": "0",
        "expected": "true"
      }
    ]
  },
  {
    "id": "binary-tree-level-order-traversal",
    "title": "Binary Tree Level Order Traversal",
    "difficulty": "Medium",
    "tags": [
      "Tree",
      "BFS"
    ],
    "statement": "<p>Given the root of a binary tree, return its node values in level-order traversal: level by level from top to bottom, and left to right within each level.</p>",
    "io": "<p><strong>Input:</strong> <code>k</code>, then <code>k</code> level-order tokens.<br><strong>Output:</strong> the node values in level order (top-to-bottom, left-to-right).</p>",
    "boiler": {
      "js": "const toks = input.trim().length ? input.trim().split(/\\s+/) : [];\nlet p = 0;\nfunction buildTree(vals){\n  if(vals.length===0 || vals[0]==='null') return null;\n  const root={val:Number(vals[0]),left:null,right:null};\n  const q=[root]; let i=1;\n  while(q.length && i<vals.length){\n    const node=q.shift();\n    if(i<vals.length){const l=vals[i++]; if(l!=='null'){node.left={val:Number(l),left:null,right:null}; q.push(node.left);}}\n    if(i<vals.length){const r=vals[i++]; if(r!=='null'){node.right={val:Number(r),left:null,right:null}; q.push(node.right);}}\n  }\n  return root;\n}\nconst k = Number(toks[p++]);\nconst vals = toks.slice(p, p + k); p += k;\nconst root = buildTree(vals);\n\n// TODO\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <queue>\nusing namespace std;\n\nstruct Node { int val; Node* left; Node* right; Node(int v):val(v),left(nullptr),right(nullptr){} };\n\nNode* buildTree(const vector<string>& vals){\n    if(vals.empty() || vals[0]==\"null\") return nullptr;\n    Node* root = new Node(stoi(vals[0]));\n    queue<Node*> q; q.push(root); size_t i = 1;\n    while(!q.empty() && i < vals.size()){\n        Node* node = q.front(); q.pop();\n        if(i < vals.size()){ string l = vals[i++]; if(l!=\"null\"){ node->left = new Node(stoi(l)); q.push(node->left); } }\n        if(i < vals.size()){ string r = vals[i++]; if(r!=\"null\"){ node->right = new Node(stoi(r)); q.push(node->right); } }\n    }\n    return root;\n}\n\nint main() {\n    int k; cin >> k;\n    vector<string> vals(k);\n    for (int i = 0; i < k; i++) cin >> vals[i];\n    Node* root = buildTree(vals);\n\n    // TODO\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const toks = input.trim().length ? input.trim().split(/\\s+/) : [];\nlet p = 0;\nfunction buildTree(vals){\n  if(vals.length===0 || vals[0]==='null') return null;\n  const root={val:Number(vals[0]),left:null,right:null};\n  const q=[root]; let i=1;\n  while(q.length && i<vals.length){\n    const node=q.shift();\n    if(i<vals.length){const l=vals[i++]; if(l!=='null'){node.left={val:Number(l),left:null,right:null}; q.push(node.left);}}\n    if(i<vals.length){const r=vals[i++]; if(r!=='null'){node.right={val:Number(r),left:null,right:null}; q.push(node.right);}}\n  }\n  return root;\n}\nconst k = Number(toks[p++]);\nconst vals = toks.slice(p, p + k); p += k;\nconst root = buildTree(vals);\nconst out=[]; const q=root?[root]:[];\nwhile(q.length){ const node=q.shift(); out.push(node.val); if(node.left) q.push(node.left); if(node.right) q.push(node.right); }\nif(out.length) console.log(out.join(' '));"
    },
    "tests": [
      {
        "stdin": "7\n3 9 20 null null 15 7",
        "expected": "3 9 20 15 7"
      },
      {
        "stdin": "7\n1 2 3 4 null null 5",
        "expected": "1 2 3 4 5"
      },
      {
        "stdin": "1\n1",
        "expected": "1"
      },
      {
        "stdin": "0",
        "expected": ""
      }
    ]
  },
  {
    "id": "binary-tree-right-side-view",
    "title": "Binary Tree Right Side View",
    "difficulty": "Medium",
    "tags": [
      "Tree",
      "BFS",
      "DFS"
    ],
    "statement": "<p>Given the root of a binary tree, imagine standing on its right side. Return the values of the nodes you can see, ordered from top to bottom (the rightmost node of each level).</p>",
    "io": "<p><strong>Input:</strong> <code>k</code>, then <code>k</code> level-order tokens.<br><strong>Output:</strong> the rightmost value of each level, top to bottom.</p>",
    "boiler": {
      "js": "const toks = input.trim().length ? input.trim().split(/\\s+/) : [];\nlet p = 0;\nfunction buildTree(vals){\n  if(vals.length===0 || vals[0]==='null') return null;\n  const root={val:Number(vals[0]),left:null,right:null};\n  const q=[root]; let i=1;\n  while(q.length && i<vals.length){\n    const node=q.shift();\n    if(i<vals.length){const l=vals[i++]; if(l!=='null'){node.left={val:Number(l),left:null,right:null}; q.push(node.left);}}\n    if(i<vals.length){const r=vals[i++]; if(r!=='null'){node.right={val:Number(r),left:null,right:null}; q.push(node.right);}}\n  }\n  return root;\n}\nconst k = Number(toks[p++]);\nconst vals = toks.slice(p, p + k); p += k;\nconst root = buildTree(vals);\n\n// TODO\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <queue>\nusing namespace std;\n\nstruct Node { int val; Node* left; Node* right; Node(int v):val(v),left(nullptr),right(nullptr){} };\n\nNode* buildTree(const vector<string>& vals){\n    if(vals.empty() || vals[0]==\"null\") return nullptr;\n    Node* root = new Node(stoi(vals[0]));\n    queue<Node*> q; q.push(root); size_t i = 1;\n    while(!q.empty() && i < vals.size()){\n        Node* node = q.front(); q.pop();\n        if(i < vals.size()){ string l = vals[i++]; if(l!=\"null\"){ node->left = new Node(stoi(l)); q.push(node->left); } }\n        if(i < vals.size()){ string r = vals[i++]; if(r!=\"null\"){ node->right = new Node(stoi(r)); q.push(node->right); } }\n    }\n    return root;\n}\n\nint main() {\n    int k; cin >> k;\n    vector<string> vals(k);\n    for (int i = 0; i < k; i++) cin >> vals[i];\n    Node* root = buildTree(vals);\n\n    // TODO\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const toks = input.trim().length ? input.trim().split(/\\s+/) : [];\nlet p = 0;\nfunction buildTree(vals){\n  if(vals.length===0 || vals[0]==='null') return null;\n  const root={val:Number(vals[0]),left:null,right:null};\n  const q=[root]; let i=1;\n  while(q.length && i<vals.length){\n    const node=q.shift();\n    if(i<vals.length){const l=vals[i++]; if(l!=='null'){node.left={val:Number(l),left:null,right:null}; q.push(node.left);}}\n    if(i<vals.length){const r=vals[i++]; if(r!=='null'){node.right={val:Number(r),left:null,right:null}; q.push(node.right);}}\n  }\n  return root;\n}\nconst k = Number(toks[p++]);\nconst vals = toks.slice(p, p + k); p += k;\nconst root = buildTree(vals);\nconst out=[]; let level=root?[root]:[];\nwhile(level.length){ out.push(level[level.length-1].val); const next=[]; for(const node of level){ if(node.left) next.push(node.left); if(node.right) next.push(node.right); } level=next; }\nif(out.length) console.log(out.join(' '));"
    },
    "tests": [
      {
        "stdin": "7\n1 2 3 null 5 null 4",
        "expected": "1 3 4"
      },
      {
        "stdin": "3\n1 null 3",
        "expected": "1 3"
      },
      {
        "stdin": "4\n1 2 3 4",
        "expected": "1 3 4"
      },
      {
        "stdin": "0",
        "expected": ""
      }
    ]
  },
  {
    "id": "validate-binary-search-tree",
    "title": "Validate Binary Search Tree",
    "difficulty": "Medium",
    "tags": [
      "Tree",
      "DFS",
      "BST"
    ],
    "statement": "<p>Given the root of a binary tree, return <code>true</code> if it is a valid binary search tree: every node in the left subtree is strictly less than the node, every node in the right subtree is strictly greater, and both subtrees are themselves valid BSTs.</p>",
    "io": "<p><strong>Input:</strong> <code>k</code>, then <code>k</code> level-order tokens.<br><strong>Output:</strong> <code>true</code> or <code>false</code>.</p>",
    "boiler": {
      "js": "const toks = input.trim().length ? input.trim().split(/\\s+/) : [];\nlet p = 0;\nfunction buildTree(vals){\n  if(vals.length===0 || vals[0]==='null') return null;\n  const root={val:Number(vals[0]),left:null,right:null};\n  const q=[root]; let i=1;\n  while(q.length && i<vals.length){\n    const node=q.shift();\n    if(i<vals.length){const l=vals[i++]; if(l!=='null'){node.left={val:Number(l),left:null,right:null}; q.push(node.left);}}\n    if(i<vals.length){const r=vals[i++]; if(r!=='null'){node.right={val:Number(r),left:null,right:null}; q.push(node.right);}}\n  }\n  return root;\n}\nconst k = Number(toks[p++]);\nconst vals = toks.slice(p, p + k); p += k;\nconst root = buildTree(vals);\n\n// TODO\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <queue>\nusing namespace std;\n\nstruct Node { int val; Node* left; Node* right; Node(int v):val(v),left(nullptr),right(nullptr){} };\n\nNode* buildTree(const vector<string>& vals){\n    if(vals.empty() || vals[0]==\"null\") return nullptr;\n    Node* root = new Node(stoi(vals[0]));\n    queue<Node*> q; q.push(root); size_t i = 1;\n    while(!q.empty() && i < vals.size()){\n        Node* node = q.front(); q.pop();\n        if(i < vals.size()){ string l = vals[i++]; if(l!=\"null\"){ node->left = new Node(stoi(l)); q.push(node->left); } }\n        if(i < vals.size()){ string r = vals[i++]; if(r!=\"null\"){ node->right = new Node(stoi(r)); q.push(node->right); } }\n    }\n    return root;\n}\n\nint main() {\n    int k; cin >> k;\n    vector<string> vals(k);\n    for (int i = 0; i < k; i++) cin >> vals[i];\n    Node* root = buildTree(vals);\n\n    // TODO\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const toks = input.trim().length ? input.trim().split(/\\s+/) : [];\nlet p = 0;\nfunction buildTree(vals){\n  if(vals.length===0 || vals[0]==='null') return null;\n  const root={val:Number(vals[0]),left:null,right:null};\n  const q=[root]; let i=1;\n  while(q.length && i<vals.length){\n    const node=q.shift();\n    if(i<vals.length){const l=vals[i++]; if(l!=='null'){node.left={val:Number(l),left:null,right:null}; q.push(node.left);}}\n    if(i<vals.length){const r=vals[i++]; if(r!=='null'){node.right={val:Number(r),left:null,right:null}; q.push(node.right);}}\n  }\n  return root;\n}\nconst k = Number(toks[p++]);\nconst vals = toks.slice(p, p + k); p += k;\nconst root = buildTree(vals);\nfunction valid(node,lo,hi){ if(!node) return true; if(node.val<=lo || node.val>=hi) return false; return valid(node.left,lo,node.val)&&valid(node.right,node.val,hi); }\nconsole.log(valid(root,-Infinity,Infinity) ? 'true' : 'false');"
    },
    "tests": [
      {
        "stdin": "3\n2 1 3",
        "expected": "true"
      },
      {
        "stdin": "7\n5 1 4 null null 3 6",
        "expected": "false"
      },
      {
        "stdin": "1\n1",
        "expected": "true"
      },
      {
        "stdin": "0",
        "expected": "true"
      }
    ]
  },
  {
    "id": "kth-smallest-element-in-a-bst",
    "title": "Kth Smallest Element in a BST",
    "difficulty": "Medium",
    "tags": [
      "Tree",
      "BST",
      "DFS"
    ],
    "statement": "<p>Given the root of a binary search tree and an integer <code>k</code>, return the <code>k</code>-th smallest value (1-indexed) among all node values.</p>",
    "io": "<p><strong>Input:</strong> <code>k</code>, then <code>k</code> level-order tokens, then the integer <code>k</code> (the rank).<br><strong>Output:</strong> the k-th smallest value.</p>",
    "boiler": {
      "js": "const toks = input.trim().length ? input.trim().split(/\\s+/) : [];\nlet p = 0;\nfunction buildTree(vals){\n  if(vals.length===0 || vals[0]==='null') return null;\n  const root={val:Number(vals[0]),left:null,right:null};\n  const q=[root]; let i=1;\n  while(q.length && i<vals.length){\n    const node=q.shift();\n    if(i<vals.length){const l=vals[i++]; if(l!=='null'){node.left={val:Number(l),left:null,right:null}; q.push(node.left);}}\n    if(i<vals.length){const r=vals[i++]; if(r!=='null'){node.right={val:Number(r),left:null,right:null}; q.push(node.right);}}\n  }\n  return root;\n}\nconst k = Number(toks[p++]);\nconst vals = toks.slice(p, p + k); p += k;\nconst root = buildTree(vals);\nconst kk = Number(toks[p++]);\n\n// TODO\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <queue>\nusing namespace std;\n\nstruct Node { int val; Node* left; Node* right; Node(int v):val(v),left(nullptr),right(nullptr){} };\n\nNode* buildTree(const vector<string>& vals){\n    if(vals.empty() || vals[0]==\"null\") return nullptr;\n    Node* root = new Node(stoi(vals[0]));\n    queue<Node*> q; q.push(root); size_t i = 1;\n    while(!q.empty() && i < vals.size()){\n        Node* node = q.front(); q.pop();\n        if(i < vals.size()){ string l = vals[i++]; if(l!=\"null\"){ node->left = new Node(stoi(l)); q.push(node->left); } }\n        if(i < vals.size()){ string r = vals[i++]; if(r!=\"null\"){ node->right = new Node(stoi(r)); q.push(node->right); } }\n    }\n    return root;\n}\n\nint main() {\n    int k; cin >> k;\n    vector<string> vals(k);\n    for (int i = 0; i < k; i++) cin >> vals[i];\n    Node* root = buildTree(vals);\n    int kk; cin >> kk;\n\n    // TODO\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const toks = input.trim().length ? input.trim().split(/\\s+/) : [];\nlet p = 0;\nfunction buildTree(vals){\n  if(vals.length===0 || vals[0]==='null') return null;\n  const root={val:Number(vals[0]),left:null,right:null};\n  const q=[root]; let i=1;\n  while(q.length && i<vals.length){\n    const node=q.shift();\n    if(i<vals.length){const l=vals[i++]; if(l!=='null'){node.left={val:Number(l),left:null,right:null}; q.push(node.left);}}\n    if(i<vals.length){const r=vals[i++]; if(r!=='null'){node.right={val:Number(r),left:null,right:null}; q.push(node.right);}}\n  }\n  return root;\n}\nconst k = Number(toks[p++]);\nconst vals = toks.slice(p, p + k); p += k;\nconst root = buildTree(vals);\nconst kk = Number(toks[p++]);\nconst order=[];\nfunction inorder(node){ if(!node) return; inorder(node.left); order.push(node.val); inorder(node.right); }\ninorder(root);\nconsole.log(order[kk-1]);"
    },
    "tests": [
      {
        "stdin": "5\n3 1 4 null 2\n1",
        "expected": "1"
      },
      {
        "stdin": "5\n3 1 4 null 2\n4",
        "expected": "4"
      },
      {
        "stdin": "8\n5 3 6 2 4 null null 1\n3",
        "expected": "3"
      },
      {
        "stdin": "1\n1\n1",
        "expected": "1"
      }
    ]
  },
  {
    "id": "number-of-islands",
    "title": "Number of Islands",
    "difficulty": "Medium",
    "tags": [
      "Grid",
      "DFS",
      "BFS",
      "Union Find"
    ],
    "statement": "<p>Given an <code>m x n</code> grid of <code>0</code>s (water) and <code>1</code>s (land), count the number of <strong>islands</strong>. An island is a group of adjacent land cells connected <strong>4-directionally</strong> (up, down, left, right).</p>",
    "io": "<p><strong>Input:</strong> <code>m n</code>, then <code>m*n</code> values (0/1) in row-major order.<br><strong>Output:</strong> the number of islands.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst m = d[p++], n = d[p++];\nconst g = [];\nfor (let i = 0; i < m; i++) { g.push(d.slice(p, p + n)); p += n; }\n\n// TODO: console.log(numberOfIslands);\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int m, n; cin >> m >> n;\n    vector<vector<int>> g(m, vector<int>(n));\n    for (int i = 0; i < m; i++)\n        for (int j = 0; j < n; j++) cin >> g[i][j];\n\n    // TODO: print the number of islands\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);let p=0;const m=d[p++],n=d[p++];const g=[];for(let i=0;i<m;i++){g.push(d.slice(p,p+n));p+=n;}\nlet count=0;const stack=[];\nfor(let i=0;i<m;i++)for(let j=0;j<n;j++){if(g[i][j]===1){count++;stack.push([i,j]);g[i][j]=0;while(stack.length){const[r,c]=stack.pop();const dirs=[[1,0],[-1,0],[0,1],[0,-1]];for(const[dr,dc]of dirs){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<m&&nc>=0&&nc<n&&g[nr][nc]===1){g[nr][nc]=0;stack.push([nr,nc]);}}}}}\nconsole.log(count);"
    },
    "tests": [
      {
        "stdin": "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0",
        "expected": "1"
      },
      {
        "stdin": "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1",
        "expected": "3"
      },
      {
        "stdin": "1 1\n0",
        "expected": "0"
      },
      {
        "stdin": "1 1\n1",
        "expected": "1"
      },
      {
        "stdin": "3 3\n1 0 1\n0 1 0\n1 0 1",
        "expected": "5"
      }
    ]
  },
  {
    "id": "rotting-oranges",
    "title": "Rotting Oranges",
    "difficulty": "Medium",
    "tags": [
      "Grid",
      "BFS"
    ],
    "statement": "<p>In an <code>m x n</code> grid each cell is <code>0</code> (empty), <code>1</code> (fresh orange), or <code>2</code> (rotten orange). Every minute, any fresh orange adjacent <strong>4-directionally</strong> to a rotten orange becomes rotten. Return the minimum number of minutes until no cell has a fresh orange, or <code>-1</code> if impossible.</p>",
    "io": "<p><strong>Input:</strong> <code>m n</code>, then <code>m*n</code> values (0/1/2) row-major.<br><strong>Output:</strong> minutes elapsed, or <code>-1</code>.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst m = d[p++], n = d[p++];\nconst g = [];\nfor (let i = 0; i < m; i++) { g.push(d.slice(p, p + n)); p += n; }\n\n// TODO: console.log(minutes);\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <queue>\nusing namespace std;\n\nint main() {\n    int m, n; cin >> m >> n;\n    vector<vector<int>> g(m, vector<int>(n));\n    for (int i = 0; i < m; i++)\n        for (int j = 0; j < n; j++) cin >> g[i][j];\n\n    // TODO: print minutes elapsed, or -1\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);let p=0;const m=d[p++],n=d[p++];const g=[];for(let i=0;i<m;i++){g.push(d.slice(p,p+n));p+=n;}\nlet q=[];let fresh=0;\nfor(let i=0;i<m;i++)for(let j=0;j<n;j++){if(g[i][j]===2)q.push([i,j]);else if(g[i][j]===1)fresh++;}\nlet minutes=0;const dirs=[[1,0],[-1,0],[0,1],[0,-1]];\nwhile(q.length&&fresh>0){const nq=[];for(const[r,c]of q){for(const[dr,dc]of dirs){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<m&&nc>=0&&nc<n&&g[nr][nc]===1){g[nr][nc]=2;fresh--;nq.push([nr,nc]);}}}q=nq;minutes++;}\nconsole.log(fresh>0?-1:minutes);"
    },
    "tests": [
      {
        "stdin": "3 3\n2 1 1\n1 1 0\n0 1 1",
        "expected": "4"
      },
      {
        "stdin": "3 3\n2 1 1\n0 1 1\n1 0 1",
        "expected": "-1"
      },
      {
        "stdin": "1 2\n0 2",
        "expected": "0"
      },
      {
        "stdin": "1 1\n0",
        "expected": "0"
      },
      {
        "stdin": "2 2\n2 2\n1 1",
        "expected": "1"
      }
    ]
  },
  {
    "id": "course-schedule",
    "title": "Course Schedule",
    "difficulty": "Medium",
    "tags": [
      "Graph",
      "Topological Sort",
      "DFS"
    ],
    "statement": "<p>There are <code>numCourses</code> courses labeled <code>0</code> to <code>numCourses-1</code>. Each dependency pair <code>a b</code> means course <code>a</code> depends on course <code>b</code> (you must take <code>b</code> before <code>a</code>). Return <code>true</code> if you can finish all courses (the dependency graph has no cycle), otherwise <code>false</code>.</p>",
    "io": "<p><strong>Input:</strong> <code>numCourses</code>, then <code>E</code>, then <code>E</code> pairs <code>a b</code>.<br><strong>Output:</strong> <code>true</code> or <code>false</code>.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst numCourses = d[p++];\nconst E = d[p++];\nconst edges = [];\nfor (let i = 0; i < E; i++) { edges.push([d[p], d[p + 1]]); p += 2; }\n\n// TODO: console.log(canFinish ? 'true' : 'false');\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int numCourses, E; cin >> numCourses >> E;\n    vector<pair<int,int>> edges(E);\n    for (int i = 0; i < E; i++) cin >> edges[i].first >> edges[i].second;\n\n    // TODO: print \"true\" or \"false\"\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);let p=0;const numCourses=d[p++];const E=d[p++];const edges=[];for(let i=0;i<E;i++){edges.push([d[p],d[p+1]]);p+=2;}\nconst adj=Array.from({length:numCourses},()=>[]);const indeg=new Array(numCourses).fill(0);\nfor(const[a,b]of edges){adj[b].push(a);indeg[a]++;}\nlet q=[];for(let i=0;i<numCourses;i++)if(indeg[i]===0)q.push(i);\nlet seen=0;while(q.length){const nq=[];for(const u of q){seen++;for(const v of adj[u]){if(--indeg[v]===0)nq.push(v);}}q=nq;}\nconsole.log(seen===numCourses?'true':'false');"
    },
    "tests": [
      {
        "stdin": "2\n1\n1 0",
        "expected": "true"
      },
      {
        "stdin": "2\n2\n1 0\n0 1",
        "expected": "false"
      },
      {
        "stdin": "1\n0",
        "expected": "true"
      },
      {
        "stdin": "4\n4\n1 0\n2 1\n3 2\n1 3",
        "expected": "false"
      },
      {
        "stdin": "3\n2\n1 0\n2 0",
        "expected": "true"
      }
    ]
  },
  {
    "id": "number-of-connected-components-in-an-undirected-graph",
    "title": "Number of Connected Components in an Undirected Graph",
    "difficulty": "Medium",
    "tags": [
      "Graph",
      "Union Find",
      "DFS"
    ],
    "statement": "<p>Given <code>n</code> nodes labeled <code>0</code> to <code>n-1</code> and a list of undirected edges, return the number of <strong>connected components</strong> in the graph.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>E</code>, then <code>E</code> undirected edge pairs <code>u v</code>.<br><strong>Output:</strong> the number of connected components.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst E = d[p++];\nconst edges = [];\nfor (let i = 0; i < E; i++) { edges.push([d[p], d[p + 1]]); p += 2; }\n\n// TODO: console.log(components);\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n, E; cin >> n >> E;\n    vector<pair<int,int>> edges(E);\n    for (int i = 0; i < E; i++) cin >> edges[i].first >> edges[i].second;\n\n    // TODO: print the number of connected components\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);let p=0;const n=d[p++];const E=d[p++];const edges=[];for(let i=0;i<E;i++){edges.push([d[p],d[p+1]]);p+=2;}\nconst parent=Array.from({length:n},(_,i)=>i);function find(x){while(parent[x]!==x){parent[x]=parent[parent[x]];x=parent[x];}return x;}\nlet comp=n;for(const[u,v]of edges){const ru=find(u),rv=find(v);if(ru!==rv){parent[ru]=rv;comp--;}}\nconsole.log(comp);"
    },
    "tests": [
      {
        "stdin": "5\n3\n0 1\n1 2\n3 4",
        "expected": "2"
      },
      {
        "stdin": "5\n4\n0 1\n1 2\n2 3\n3 4",
        "expected": "1"
      },
      {
        "stdin": "4\n0",
        "expected": "4"
      },
      {
        "stdin": "1\n0",
        "expected": "1"
      },
      {
        "stdin": "6\n3\n0 1\n2 3\n4 5",
        "expected": "3"
      }
    ]
  },
  {
    "id": "flood-fill",
    "title": "Flood Fill",
    "difficulty": "Easy",
    "tags": [
      "Grid",
      "DFS",
      "BFS"
    ],
    "statement": "<p>Given an image as an <code>m x n</code> grid of integer colors, a starting pixel <code>(sr, sc)</code>, and a <code>newColor</code>, perform a <strong>flood fill</strong>: change the starting pixel and all 4-directionally connected pixels of the same original color to <code>newColor</code>. Return the resulting grid.</p>",
    "io": "<p><strong>Input:</strong> <code>m n</code>, then <code>m*n</code> ints row-major, then <code>sr sc newColor</code>.<br><strong>Output:</strong> the grid after fill, row-major (all values space-separated).</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst m = d[p++], n = d[p++];\nconst g = [];\nfor (let i = 0; i < m; i++) { g.push(d.slice(p, p + n)); p += n; }\nconst sr = d[p++], sc = d[p++], newColor = d[p++];\n\n// TODO: print the grid row-major, space-separated\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int m, n; cin >> m >> n;\n    vector<vector<int>> g(m, vector<int>(n));\n    for (int i = 0; i < m; i++)\n        for (int j = 0; j < n; j++) cin >> g[i][j];\n    int sr, sc, newColor; cin >> sr >> sc >> newColor;\n\n    // TODO: print the grid row-major, space-separated\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);let p=0;const m=d[p++],n=d[p++];const g=[];for(let i=0;i<m;i++){g.push(d.slice(p,p+n));p+=n;}const sr=d[p++],sc=d[p++],newColor=d[p++];\nconst old=g[sr][sc];\nif(old!==newColor){const stack=[[sr,sc]];g[sr][sc]=newColor;const dirs=[[1,0],[-1,0],[0,1],[0,-1]];while(stack.length){const[r,c]=stack.pop();for(const[dr,dc]of dirs){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<m&&nc>=0&&nc<n&&g[nr][nc]===old){g[nr][nc]=newColor;stack.push([nr,nc]);}}}}\nconst out=[];for(let i=0;i<m;i++)out.push(g[i].join(' '));console.log(out.join('\\n'));"
    },
    "tests": [
      {
        "stdin": "3 3\n1 1 1\n1 1 0\n1 0 1\n1 1 2",
        "expected": "2 2 2\n2 2 0\n2 0 1"
      },
      {
        "stdin": "2 2\n0 0\n0 0\n0 0 0",
        "expected": "0 0\n0 0"
      },
      {
        "stdin": "1 1\n5\n0 0 9",
        "expected": "9"
      },
      {
        "stdin": "2 3\n1 2 1\n2 1 2\n0 0 7",
        "expected": "7 2 1\n2 1 2"
      }
    ]
  },
  {
    "id": "word-search",
    "title": "Word Search",
    "difficulty": "Medium",
    "tags": [
      "Grid",
      "Backtracking",
      "DFS"
    ],
    "statement": "<p>Given an <code>m x n</code> grid of letters and a <code>word</code>, return <code>true</code> if the word can be constructed from letters of <strong>sequentially adjacent</strong> cells (horizontally or vertically neighboring). The same cell may not be used more than once.</p>",
    "io": "<p><strong>Input:</strong> <code>m n</code>, then <code>m*n</code> single-letter tokens row-major, then the <code>word</code> token.<br><strong>Output:</strong> <code>true</code> or <code>false</code>.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/);\nlet p = 0;\nconst m = +d[p++], n = +d[p++];\nconst g = [];\nfor (let i = 0; i < m; i++) { g.push(d.slice(p, p + n)); p += n; }\nconst word = d[p++];\n\n// TODO: console.log(exists ? 'true' : 'false');\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\nint main() {\n    int m, n; cin >> m >> n;\n    vector<vector<string>> g(m, vector<string>(n));\n    for (int i = 0; i < m; i++)\n        for (int j = 0; j < n; j++) cin >> g[i][j];\n    string word; cin >> word;\n\n    // TODO: print \"true\" or \"false\"\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/);let p=0;const m=+d[p++],n=+d[p++];const g=[];for(let i=0;i<m;i++){g.push(d.slice(p,p+n));p+=n;}const word=d[p++];\nconst dirs=[[1,0],[-1,0],[0,1],[0,-1]];\nfunction dfs(r,c,k){if(k===word.length)return true;if(r<0||r>=m||c<0||c>=n||g[r][c]!==word[k])return false;const tmp=g[r][c];g[r][c]='#';for(const[dr,dc]of dirs){if(dfs(r+dr,c+dc,k+1)){g[r][c]=tmp;return true;}}g[r][c]=tmp;return false;}\nlet found=false;for(let i=0;i<m&&!found;i++)for(let j=0;j<n&&!found;j++){if(dfs(i,j,0))found=true;}\nconsole.log(found?'true':'false');"
    },
    "tests": [
      {
        "stdin": "3 4\nA B C E\nS F C S\nA D E E\nABCCED",
        "expected": "true"
      },
      {
        "stdin": "3 4\nA B C E\nS F C S\nA D E E\nSEE",
        "expected": "true"
      },
      {
        "stdin": "3 4\nA B C E\nS F C S\nA D E E\nABCB",
        "expected": "false"
      },
      {
        "stdin": "1 1\nA\nA",
        "expected": "true"
      },
      {
        "stdin": "1 1\nA\nB",
        "expected": "false"
      }
    ]
  },
  {
    "id": "n-queens-ii",
    "title": "N-Queens II",
    "difficulty": "Hard",
    "tags": [
      "Backtracking"
    ],
    "statement": "<p>The <strong>n-queens</strong> puzzle places <code>n</code> queens on an <code>n x n</code> chessboard so that no two queens attack each other (no shared row, column, or diagonal). Given <code>n</code>, return the number of distinct solutions.</p>",
    "io": "<p><strong>Input:</strong> a single integer <code>n</code>.<br><strong>Output:</strong> the number of distinct solutions.</p>",
    "boiler": {
      "js": "const n = Number(input.trim());\n\n// TODO: console.log(totalSolutions);\n",
      "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n\n    // TODO: print the number of distinct solutions\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const n=Number(input.trim());\nlet count=0;const cols=new Set(),diag=new Set(),anti=new Set();\nfunction place(r){if(r===n){count++;return;}for(let c=0;c<n;c++){if(cols.has(c)||diag.has(r-c)||anti.has(r+c))continue;cols.add(c);diag.add(r-c);anti.add(r+c);place(r+1);cols.delete(c);diag.delete(r-c);anti.delete(r+c);}}\nplace(0);console.log(count);"
    },
    "tests": [
      {
        "stdin": "1",
        "expected": "1"
      },
      {
        "stdin": "2",
        "expected": "0"
      },
      {
        "stdin": "4",
        "expected": "2"
      },
      {
        "stdin": "6",
        "expected": "4"
      },
      {
        "stdin": "8",
        "expected": "92"
      }
    ]
  },
  {
    "id": "unique-paths",
    "title": "Unique Paths",
    "difficulty": "Medium",
    "tags": [
      "DP",
      "Math"
    ],
    "statement": "<p>A robot starts at the top-left corner of an <code>m x n</code> grid and wants to reach the bottom-right corner. It can only move <strong>right</strong> or <strong>down</strong>. Return the number of unique paths.</p>",
    "io": "<p><strong>Input:</strong> <code>m n</code>.<br><strong>Output:</strong> the number of unique paths.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nconst m = d[0], n = d[1];\n\n// TODO: console.log(paths);\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int m, n; cin >> m >> n;\n\n    // TODO: print the number of unique paths\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);const m=d[0],n=d[1];\nconst dp=new Array(n).fill(1);\nfor(let i=1;i<m;i++)for(let j=1;j<n;j++)dp[j]+=dp[j-1];\nconsole.log(dp[n-1]);"
    },
    "tests": [
      {
        "stdin": "3 7",
        "expected": "28"
      },
      {
        "stdin": "3 2",
        "expected": "3"
      },
      {
        "stdin": "1 1",
        "expected": "1"
      },
      {
        "stdin": "1 10",
        "expected": "1"
      },
      {
        "stdin": "3 3",
        "expected": "6"
      }
    ]
  },
  {
    "id": "unique-paths-ii",
    "title": "Unique Paths II",
    "difficulty": "Medium",
    "tags": [
      "DP",
      "Grid"
    ],
    "statement": "<p>Same as Unique Paths, but the <code>m x n</code> grid contains obstacles marked <code>1</code> (free cells are <code>0</code>). A path cannot pass through an obstacle. Moving only <strong>right</strong> or <strong>down</strong>, return the number of unique paths from top-left to bottom-right.</p>",
    "io": "<p><strong>Input:</strong> <code>m n</code>, then <code>m*n</code> ints (0 free, 1 obstacle) row-major.<br><strong>Output:</strong> the number of unique paths.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst m = d[p++], n = d[p++];\nconst g = [];\nfor (let i = 0; i < m; i++) { g.push(d.slice(p, p + n)); p += n; }\n\n// TODO: console.log(paths);\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int m, n; cin >> m >> n;\n    vector<vector<int>> g(m, vector<int>(n));\n    for (int i = 0; i < m; i++)\n        for (int j = 0; j < n; j++) cin >> g[i][j];\n\n    // TODO: print the number of unique paths\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);let p=0;const m=d[p++],n=d[p++];const g=[];for(let i=0;i<m;i++){g.push(d.slice(p,p+n));p+=n;}\nconst dp=new Array(n).fill(0);dp[0]=g[0][0]===1?0:1;\nfor(let i=0;i<m;i++){for(let j=0;j<n;j++){if(g[i][j]===1){dp[j]=0;}else if(j>0){dp[j]+=dp[j-1];}}}\nconsole.log(dp[n-1]);"
    },
    "tests": [
      {
        "stdin": "3 3\n0 0 0\n0 1 0\n0 0 0",
        "expected": "2"
      },
      {
        "stdin": "2 2\n0 1\n0 0",
        "expected": "1"
      },
      {
        "stdin": "1 1\n0",
        "expected": "1"
      },
      {
        "stdin": "1 1\n1",
        "expected": "0"
      },
      {
        "stdin": "2 2\n1 0\n0 0",
        "expected": "0"
      }
    ]
  },
  {
    "id": "minimum-path-sum",
    "title": "Minimum Path Sum",
    "difficulty": "Medium",
    "tags": [
      "DP",
      "Grid"
    ],
    "statement": "<p>Given an <code>m x n</code> grid of non-negative integers, find a path from the top-left to the bottom-right which <strong>minimizes</strong> the sum of all numbers along the path. You can only move <strong>right</strong> or <strong>down</strong>. Return that minimum sum.</p>",
    "io": "<p><strong>Input:</strong> <code>m n</code>, then <code>m*n</code> non-negative ints row-major.<br><strong>Output:</strong> the minimum path sum.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst m = d[p++], n = d[p++];\nconst g = [];\nfor (let i = 0; i < m; i++) { g.push(d.slice(p, p + n)); p += n; }\n\n// TODO: console.log(minSum);\n",
      "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int m, n; cin >> m >> n;\n    vector<vector<int>> g(m, vector<int>(n));\n    for (int i = 0; i < m; i++)\n        for (int j = 0; j < n; j++) cin >> g[i][j];\n\n    // TODO: print the minimum path sum\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);let p=0;const m=d[p++],n=d[p++];const g=[];for(let i=0;i<m;i++){g.push(d.slice(p,p+n));p+=n;}\nconst dp=new Array(n).fill(0);\nfor(let i=0;i<m;i++){for(let j=0;j<n;j++){if(i===0&&j===0)dp[j]=g[0][0];else if(i===0)dp[j]=dp[j-1]+g[i][j];else if(j===0)dp[j]=dp[j]+g[i][j];else dp[j]=Math.min(dp[j],dp[j-1])+g[i][j];}}\nconsole.log(dp[n-1]);"
    },
    "tests": [
      {
        "stdin": "3 3\n1 3 1\n1 5 1\n4 2 1",
        "expected": "7"
      },
      {
        "stdin": "2 3\n1 2 3\n4 5 6",
        "expected": "12"
      },
      {
        "stdin": "1 1\n0",
        "expected": "0"
      },
      {
        "stdin": "1 4\n1 2 3 4",
        "expected": "10"
      },
      {
        "stdin": "4 1\n1 2 3 4",
        "expected": "10"
      }
    ]
  },
  {
    "id": "longest-common-subsequence",
    "title": "Longest Common Subsequence",
    "difficulty": "Medium",
    "tags": [
      "DP",
      "String"
    ],
    "statement": "<p>Given two strings <code>a</code> and <code>b</code>, return the length of their <strong>longest common subsequence</strong>. A subsequence keeps the relative order of characters but need not be contiguous.</p>",
    "io": "<p><strong>Input:</strong> two string tokens <code>a</code> and <code>b</code>.<br><strong>Output:</strong> the length of the LCS.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/);\nconst a = d[0], b = d[1];\n\n// TODO: console.log(lcsLength);\n",
      "cpp": "#include <iostream>\n#include <string>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    string a, b; cin >> a >> b;\n\n    // TODO: print the length of the LCS\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/);const a=d[0],b=d[1];\nconst m=a.length,n=b.length;const dp=Array.from({length:m+1},()=>new Array(n+1).fill(0));\nfor(let i=1;i<=m;i++)for(let j=1;j<=n;j++){if(a[i-1]===b[j-1])dp[i][j]=dp[i-1][j-1]+1;else dp[i][j]=Math.max(dp[i-1][j],dp[i][j-1]);}\nconsole.log(dp[m][n]);"
    },
    "tests": [
      {
        "stdin": "abcde ace",
        "expected": "3"
      },
      {
        "stdin": "abc abc",
        "expected": "3"
      },
      {
        "stdin": "abc def",
        "expected": "0"
      },
      {
        "stdin": "bsbininm jmjkbkjkv",
        "expected": "1"
      },
      {
        "stdin": "aggtab gxtxayb",
        "expected": "4"
      }
    ]
  },
  {
    "id": "edit-distance",
    "title": "Edit Distance",
    "difficulty": "Medium",
    "tags": [
      "DP",
      "String"
    ],
    "statement": "<p>Given two strings <code>a</code> and <code>b</code>, return the minimum number of operations required to convert <code>a</code> into <code>b</code>. The permitted operations are <strong>insert</strong> a character, <strong>delete</strong> a character, and <strong>replace</strong> a character.</p>",
    "io": "<p><strong>Input:</strong> two string tokens <code>a</code> and <code>b</code>.<br><strong>Output:</strong> the minimum edit distance.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/);\nconst a = d[0], b = d[1];\n\n// TODO: console.log(distance);\n",
      "cpp": "#include <iostream>\n#include <string>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    string a, b; cin >> a >> b;\n\n    // TODO: print the minimum edit distance\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/);const a=d[0],b=d[1];\nconst m=a.length,n=b.length;const dp=Array.from({length:m+1},()=>new Array(n+1).fill(0));\nfor(let i=0;i<=m;i++)dp[i][0]=i;for(let j=0;j<=n;j++)dp[0][j]=j;\nfor(let i=1;i<=m;i++)for(let j=1;j<=n;j++){if(a[i-1]===b[j-1])dp[i][j]=dp[i-1][j-1];else dp[i][j]=1+Math.min(dp[i-1][j-1],dp[i-1][j],dp[i][j-1]);}\nconsole.log(dp[m][n]);"
    },
    "tests": [
      {
        "stdin": "horse ros",
        "expected": "3"
      },
      {
        "stdin": "intention execution",
        "expected": "5"
      },
      {
        "stdin": "abc abc",
        "expected": "0"
      },
      {
        "stdin": "a b",
        "expected": "1"
      },
      {
        "stdin": "sunday saturday",
        "expected": "3"
      }
    ]
  },
  {
    "id": "word-break",
    "title": "Word Break",
    "difficulty": "Medium",
    "tags": [
      "DP",
      "String",
      "Hash Table"
    ],
    "statement": "<p>Given a string <code>s</code> and a dictionary of words, return <code>true</code> if <code>s</code> can be segmented into a space-separated sequence of one or more dictionary words. Dictionary words may be reused.</p>",
    "io": "<p><strong>Input:</strong> string token <code>s</code>, then <code>w</code>, then <code>w</code> dictionary word tokens.<br><strong>Output:</strong> <code>true</code> or <code>false</code>.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/);\nlet p = 0;\nconst s = d[p++];\nconst w = +d[p++];\nconst dict = d.slice(p, p + w); p += w;\n\n// TODO: console.log(canBreak ? 'true' : 'false');\n",
      "cpp": "#include <iostream>\n#include <string>\n#include <vector>\n#include <unordered_set>\nusing namespace std;\n\nint main() {\n    string s; cin >> s;\n    int w; cin >> w;\n    unordered_set<string> dict;\n    for (int i = 0; i < w; i++) { string x; cin >> x; dict.insert(x); }\n\n    // TODO: print \"true\" or \"false\"\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/);let p=0;const s=d[p++];const w=+d[p++];const dict=new Set(d.slice(p,p+w));p+=w;\nconst n=s.length;const dp=new Array(n+1).fill(false);dp[0]=true;\nfor(let i=1;i<=n;i++){for(let j=0;j<i;j++){if(dp[j]&&dict.has(s.slice(j,i))){dp[i]=true;break;}}}\nconsole.log(dp[n]?'true':'false');"
    },
    "tests": [
      {
        "stdin": "leetcode\n2\nleet\ncode",
        "expected": "true"
      },
      {
        "stdin": "applepenapple\n2\napple\npen",
        "expected": "true"
      },
      {
        "stdin": "catsandog\n5\ncats\ndog\nsand\nand\ncat",
        "expected": "false"
      },
      {
        "stdin": "a\n1\na",
        "expected": "true"
      },
      {
        "stdin": "aaaaaaa\n2\naaaa\naaa",
        "expected": "true"
      }
    ]
  },
  {
    "id": "partition-equal-subset-sum",
    "title": "Partition Equal Subset Sum",
    "difficulty": "Medium",
    "tags": [
      "DP",
      "Array"
    ],
    "statement": "<p>Given an array of <code>n</code> positive integers, return <code>true</code> if the array can be partitioned into two subsets whose sums are equal, otherwise <code>false</code>.</p>",
    "io": "<p><strong>Input:</strong> <code>n</code>, then <code>n</code> positive ints.<br><strong>Output:</strong> <code>true</code> or <code>false</code>.</p>",
    "boiler": {
      "js": "const d = input.trim().split(/\\s+/).map(Number);\nlet p = 0;\nconst n = d[p++];\nconst nums = d.slice(p, p + n); p += n;\n\n// TODO: console.log(canPartition ? 'true' : 'false');\n",
      "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n\n    // TODO: print \"true\" or \"false\"\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const d=input.trim().split(/\\s+/).map(Number);let p=0;const n=d[p++];const nums=d.slice(p,p+n);p+=n;\nlet sum=0;for(const x of nums)sum+=x;\nif(sum%2!==0){console.log('false');}else{const target=sum/2;const dp=new Array(target+1).fill(false);dp[0]=true;for(const x of nums){for(let j=target;j>=x;j--){if(dp[j-x])dp[j]=true;}}console.log(dp[target]?'true':'false');}"
    },
    "tests": [
      {
        "stdin": "4\n1 5 11 5",
        "expected": "true"
      },
      {
        "stdin": "4\n1 2 3 5",
        "expected": "false"
      },
      {
        "stdin": "1\n2",
        "expected": "false"
      },
      {
        "stdin": "2\n3 3",
        "expected": "true"
      },
      {
        "stdin": "6\n2 2 2 2 2 2",
        "expected": "true"
      }
    ]
  },
  {
    "id": "decode-ways",
    "title": "Decode Ways",
    "difficulty": "Medium",
    "tags": [
      "DP",
      "String"
    ],
    "statement": "<p>A message of digits is encoded with the mapping <code>A=1, B=2, ..., Z=26</code>. Given a non-empty digit string, return the number of ways to decode it. A leading zero, or any grouping that produces a number outside <code>1..26</code>, contributes no valid decoding.</p>",
    "io": "<p><strong>Input:</strong> one digit-string token.<br><strong>Output:</strong> the number of ways to decode it.</p>",
    "boiler": {
      "js": "const s = input.trim().split(/\\s+/)[0];\n\n// TODO: console.log(ways);\n",
      "cpp": "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s; cin >> s;\n\n    // TODO: print the number of ways to decode\n    return 0;\n}\n"
    },
    "solution": {
      "js": "const s=input.trim().split(/\\s+/)[0];\nconst n=s.length;const dp=new Array(n+1).fill(0);dp[0]=1;dp[1]=s[0]==='0'?0:1;\nfor(let i=2;i<=n;i++){const one=s[i-1];const two=s.slice(i-2,i);if(one!=='0')dp[i]+=dp[i-1];const t=parseInt(two,10);if(t>=10&&t<=26)dp[i]+=dp[i-2];}\nconsole.log(dp[n]);"
    },
    "tests": [
      {
        "stdin": "12",
        "expected": "2"
      },
      {
        "stdin": "226",
        "expected": "3"
      },
      {
        "stdin": "06",
        "expected": "0"
      },
      {
        "stdin": "10",
        "expected": "1"
      },
      {
        "stdin": "2101",
        "expected": "1"
      }
    ]
  }
];
