import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn
  } from "typeorm";
  
  @Entity({ name : "EkycData"})
  export class EkycData {

  
    @PrimaryGeneratedColumn()
    id!: number;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    txnNo!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    txnDateTime!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    aadhaarHash!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    finalStatus!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    vaultRefNumber!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    ekycTxnNo!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    ekycTimestamp!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    residentConsent!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    status!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    responseStatus!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    errorMessage!: string;
  
    @Column({ default: null, length: 255 })
    error!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    uidToken!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    actionCode!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    otp!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    otpTxnNo!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    otpTimeStamp!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    ekyc_dob!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    ekyc_gender!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    ekyc_name!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    ekyc_co!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    ekyc_country!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    ekyc_dist!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    ekyc_house!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    ekyc_street!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    ekyc_lm!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    ekyc_loc!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    ekyc_pc!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    ekyc_po!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    ekyc_state!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    ekyc_subdist!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    ekyc_vtc!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    ekyc_lang!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    local_dob!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    local_gender!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    local_name!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    local_co!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    local_country!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    local_dist!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    local_house!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    local_street!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    local_lm!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    local_loc!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    local_pc!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    local_po!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    local_state!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    local_subdist!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    local_vtc!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    local_lang!: string;
  
    @Column({ type: 'text', default: null })
    photo!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    maskedAadhaar!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    npciStatus!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    npciError!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    npciBankName!: string;
  
    @Column({ default: null, length: 200, type: 'nvarchar' })
    npciLastUpdateDate!: string;
  
    @CreateDateColumn()
    CreatedDate!: Date;
  
    @UpdateDateColumn()
    UpdatedDate!: Date;
  
  }
  