#include <iostream>
using namespace std;

int main() {
    try {
        int num1, num2;
        cin >> num1 >> num2;
        int sum = num1 * num2;
        cout << sum << endl;
    } catch (const exception& e) {
        cerr << "Error: " << e.what() << endl;
    }
    return 0;
}