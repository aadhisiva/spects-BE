import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity()
export class rc_data {
    constructor(data) {
        Object.assign(this, data);
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: null })
    benf_name: string;

    @Column({ default: null })
    dob: string;

    @Column({default: null})
    user_id: string;

    @Column({ default: null })
    taluk: string;

    @Column({ default: null })
    age: number;

    @Column({ default: null })
    district: string;

    @Column({ default: null })
    otp: string;

    @Column({ default: null })
    phone_number: string;

    @Column({ default: null })
    category: string;

    @Column({ default: null })
    caste: string;

    @Column({ default: null })
    gender: string;

    @Column({ default: null })
    education_id: string;

    @Column({ default: null })
    father_name: string;

    @Column({ default: null })
    address: string;

    @Column({ default: "" })
    aadhar_no: string;

    @Column({ default: null })
    rc_no: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
