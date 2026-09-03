import os
import sys
from utils import parse_args

def main():
    args = parse_args(sys.argv)
    if not args:
        print("Error")
        return 1
    
    for arg in args:
        print(f"Processing {arg}")
    
    return 0

if __name__ == "__main__":
    main()
