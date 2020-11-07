import React from 'react';
import { Text, View, TouchableOpacity, TextInput, Image, StyleSheet, Alert, KeyboardAvoidingView, ToastAndroid} from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import firebase from 'firebase';
import db from '../config';
import Constants from "expo-constants";
export default class TransactionScreen extends React.Component {
    constructor(){
      super();
      this.state = {
        hasCameraPermissions: null,
        scanned: false,
        scannedBookId: '',
        scannedStudentId:'',
        buttonState: 'normal'
      }
    }

    getCameraPermissions = async (id) =>{
      const {status} = await Permissions.askAsync(Permissions.CAMERA);
      
      this.setState({
        /*status === "granted" is true when user has granted permission
          status === "granted" is false when user has not granted the permission
        */
        hasCameraPermissions: status === "granted",
        buttonState: id,
        scanned: false
      });
    }

    handleBarCodeScanned = async({type, data})=>{
      const {buttonState} = this.state

      if(buttonState==="BookId"){
        this.setState({
          scanned: true,
          scannedBookId: data,
          buttonState: 'normal'
        });
      }
      else if(buttonState==="StudentId"){
        this.setState({
          scanned: true,
          scannedStudentId: data,
          buttonState: 'normal'
        });
      }
      
    }
    handleTransaction=async()=>{
      var TransactionType = await this.checkBookEligibility();
      if(TransactionType===false){
        alert("This book is not available in the database.");
        this.setState({
          scannedBookId:"",
          scannedStudentId:""
        })
      }
      else if(TransactionType==="issue"){
      var studentEligibility = await this.checkStudentEligibilityissue();
      if(studentEligibility === true){
        console.log(studentEligibility);
        this.initiateBookIssue();
        // alert("Your book has been issued. Remember to return it later!");
      }
    }else{
        var studentEligibility = await this.checkStudentEligibilityreturn();
        console.log(studentEligibility);
        if(studentEligibility===true){
          this.bookReturn();
          alert("Your book has been returned. Try borrowing something else!");
        }
    }
    }

    checkBookEligibility=async()=>{
      //Referring to database for Books collection, then finding Book Id, then getting information.
      const bookRef = await db.collection('Books').where('BookId', '==' ,this.state.scannedBookId).get();
      var TransactionType = "";
      //if book is not in database then:
      if(bookRef.docs.length === 0){
        TransactionType=false;
      }else{
        //Goes through database files one by one, or loops through records which satsify the condition that we gave in line 78.
        bookRef.docs.map(doc=>{
          var book = doc.data();
          if(book.BookAvailability === true){
            TransactionType = "issue";
          }else{
            TransactionType = "return";
          }
        });
      }
      return TransactionType;
    }

    checkStudentEligibilityissue=async()=>{
      const studentRef = await db.collection('Students').where('StudentId', '==', this.state.scannedStudentId).get();
      var studentEligibility = "";
      if(studentRef.docs.length === 0){
        studentEligibility = false;
      }else{
        studentRef.docs.map(doc=>{
          var student = doc.data();
          if(student.BooksTaken<=2){
            alert("You have just borrowed the book in our library with an id of "+ this.state.scannedBookId + ". Your student id is " +  this.state.scannedStudentId  + ". Remember these id's when returning your book. Thank you for borrwing books from Villager's Library!");
            studentEligibility=true;
          }else{
            alert("You have taken too many books already.");
            studentEligibility=false;
          }
        })
      }
      return studentEligibility;
    }

    checkStudentEligibilityreturn=async()=>{
      //Will only check the latest record
      const transactionsRef = await db.collection('Transaction').where('bookId', '==', this.state.scannedBookId).limit(1).get();
      var studentEligibility = "";
      //goes through latest database files. 
      transactionsRef.docs.map(doc=>{
        var latestTransaction = doc.data();
        console.log(latestTransaction);
        if(latestTransaction.studentId === this.state.scannedStudentId){
          studentEligibility = true;
        }else{
          studentEligibility=false;
          alert("This book was not taken by you, so you cannot return it.")
        }
      });
      return studentEligibility;
    }

    initiateBookIssue=async()=>{
      db.collection('Transaction').add({
        studentId:this.state.scannedStudentId,
        bookId: this.state.scannedBookId,
        date: firebase.firestore.Timestamp.now().toDate(),
        TransactionType: "issue"
      })
      db.collection('Books').doc(this.state.scannedBookId).update({BookAvailability:false})
      db.collection('Students').doc(this.state.scannedStudentId).update({BooksTaken:firebase.firestore.FieldValue.increment(1)})
      Alert.alert('Your book has been issued, and is now stored in our database. Thank you!');
      this.setState({
        scannedBookId:"",
        scannedStudentId:"",
      })
    }

    
    bookReturn=async()=>{
      db.collection('Transaction').add({
        studentId:this.state.scannedStudentId,
        bookId: this.state.scannedBookId,
        date: firebase.firestore.Timestamp.now().toDate(),
        TransactionType: "return"
      })
      db.collection('Books').doc(this.state.scannedBookId).update({BookAvailability:true})
      db.collection('Students').doc(this.state.scannedStudentId).update({BooksTaken:firebase.firestore.FieldValue.increment(-1)})
      Alert.alert('Your book has been returned. Come back soon to grab a new book!');
      this.setState({
        scannedBookId:"",
        scannedStudentId:"",
      })
    }


    render() {
      const hasCameraPermissions = this.state.hasCameraPermissions;
      const scanned = this.state.scanned;
      const buttonState = this.state.buttonState;
      if (buttonState !== "normal" && hasCameraPermissions){
        return(
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        );
      }

      else if (buttonState === "normal"){
        return(
          <KeyboardAvoidingView style={styles.container}
          behavior = "padding" enabled
          >
          <View>
              <Image
                source={require("../assets/booklogo.jpg")}
                style={{width:200, height: 200}}/>
              <Text style={{textAlign: 'center', fontSize: 30}}>Book and Student Identification</Text>
              <Text style={{textAlign: 'center', fontSize: 30}}>Villager's Library</Text>

            </View>
            <View style={styles.inputView}>
            <TextInput 
              style={styles.inputBox}
              placeholder="Book Id"
              onChangeText = {text=>{this.setState({scannedBookId:text})}}
              value={this.state.scannedBookId}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("BookId")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            </View>
            <View style={styles.inputView}>
            <TextInput 
              style={styles.inputBox}
              placeholder="Student Id"
              onChangeText = {text=>{this.setState({scannedStudentId:text})}}
              value={this.state.scannedStudentId}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("StudentId")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.scanButton} onPress={async()=>{this.handleTransaction()}}>
              <Text>Submit</Text>
            </TouchableOpacity>
           </KeyboardAvoidingView>
        );
      }
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    displayText:{
      fontSize: 15,
      textDecorationLine: 'underline'
    },
    scanButton:{
      backgroundColor: '#2196F3',
      padding: 10,
      margin: 10
    },
    buttonText:{
      fontSize: 15,
      textAlign: 'center',
      marginTop: 10
    },
    inputView:{
      flexDirection: 'row',
      margin: 20
    },
    inputBox:{
      width: 200,
      height: 40,
      borderWidth: 1.5,
      borderRightWidth: 0,
      fontSize: 20
    },
    scanButton:{
      backgroundColor: '#66BB6A',
      width: 50,
      borderWidth: 1.5,
      borderLeftWidth: 0
    }
  });