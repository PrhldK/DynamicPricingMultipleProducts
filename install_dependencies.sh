# Install python dependencies
echo "Install python dependencies..."
pip install -r requirements.txt

# Install NPM dependencies for visualization
echo ""
echo "Install NPM dependencies..."
cd visualization
npm install